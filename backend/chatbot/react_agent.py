"""
Comprehensive LangGraph-based Chatbot Agent
Implements complete workflow with LLM-based intent classification and form collection
"""

import json
import re
import logging
from typing import Dict, List, Any, Optional, TypedDict, Literal
from datetime import datetime

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from django.conf import settings
import groq

from .models import Conversation, ConversationMessage, ChatbotContext, ChatbotSettings
from .form_schemas import FORM_SCHEMAS, FORM_QUESTIONS
from .services import AgenticChatbotService
from .rule_based_chatbot import get_rule_based_chatbot

logger = logging.getLogger(__name__)


# State Management
class ConversationState(TypedDict):
    """Complete state for the chatbot conversation workflow"""
    
    # Session and user info
    session_id: str
    user_info: Dict[str, Any]
    ip_address: Optional[str]
    
    # Current conversation context
    messages: List[Dict[str, Any]]
    current_message: str
    
    # Form collection state
    current_form: Optional[str]
    current_step: Optional[str]
    collected_data: Dict[str, Any]
    required_fields: List[str]
    completed_fields: List[str]
    
    # Intent and classification
    intent: Optional[str]
    confidence: float
    intent_reasoning: Optional[str]
    
    # Control flags
    is_form_active: bool
    form_completed: bool
    requires_confirmation: bool
    manual_reply_active: bool
    
    # Response generation
    response: Optional[str]
    response_type: Literal['question', 'confirmation', 'completion', 'error', 'general']
    next_node: Optional[str]  # For conditional routing


class LangGraphChatbotAgent:
    """
    Comprehensive LangGraph-based chatbot agent with LLM intent classification
    """
    
    def __init__(self):
        # Load settings from database or fallback to environment variables
        chatbot_settings = ChatbotSettings.get_settings()
        api_key = chatbot_settings.get_api_key() if chatbot_settings else settings.GROQ_API_KEY
        model = chatbot_settings.get_model() if chatbot_settings else getattr(settings, 'GROQ_MODEL', 'llama-3.1-8b-instant')
        max_tokens = chatbot_settings.max_tokens if chatbot_settings else 500
        temperature = chatbot_settings.temperature if chatbot_settings else 0.7
        
        # Track API failures to disable client after repeated failures
        self.api_failure_count = 0
        self.api_disabled = False
        
        if not api_key:
            logger.warning("No Groq API key found in settings or environment variables")
            self.client = None
            self.api_disabled = True
        else:
            try:
                self.client = groq.Groq(api_key=api_key)
                # Quick validation: Check if API key format looks valid (starts with gsk_)
                if not api_key.startswith('gsk_'):
                    logger.warning("API key format appears invalid (should start with 'gsk_'), disabling LLM")
                    self.api_disabled = True
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self.client = None
                self.api_disabled = True
        
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.settings = chatbot_settings
        
        # Load context and form knowledge
        self.context_sections = self._load_context_sections()
        self.form_schemas = FORM_SCHEMAS
        self.form_questions = FORM_QUESTIONS
        
        # Initialize LangGraph with memory
        self.memory = MemorySaver()
        self.graph = self._build_graph()
    
    def _load_context_sections(self) -> Dict[str, Dict]:
        """Load chatbot context sections"""
        sections = {}
        try:
            for context in ChatbotContext.objects.filter(is_active=True):
                sections[context.section] = {
                    'title': context.title,
                    'content': context.content,
                    'keywords': context.get_keywords_list(),
                    'display_order': context.display_order
                }
        except Exception:
            pass
        return sections
    
    def _is_client_available(self) -> bool:
        """Check if Groq client is available and API key is valid"""
        if not self.client or self.api_disabled:
            return False
        return True
    
    def reload_api_key(self) -> bool:
        """
        Reload API key from database settings and reinitialize client.
        Returns True if successfully reloaded, False otherwise.
        """
        try:
            # Reload settings from database
            chatbot_settings = ChatbotSettings.get_settings()
            api_key = chatbot_settings.get_api_key() if chatbot_settings else settings.GROQ_API_KEY
            model = chatbot_settings.get_model() if chatbot_settings else getattr(settings, 'GROQ_MODEL', 'llama-3.1-8b-instant')
            max_tokens = chatbot_settings.max_tokens if chatbot_settings else 500
            temperature = chatbot_settings.temperature if chatbot_settings else 0.7
            
            # Reset failure tracking
            self.api_failure_count = 0
            self.api_disabled = False
            
            # Update model and settings
            self.model = model
            self.max_tokens = max_tokens
            self.temperature = temperature
            self.settings = chatbot_settings
            
            # Reinitialize client with new API key
            if not api_key:
                logger.warning("No Groq API key found after reload")
                self.client = None
                self.api_disabled = True
                return False
            else:
                try:
                    self.client = groq.Groq(api_key=api_key)
                    # Validate API key format
                    if not api_key.startswith('gsk_'):
                        logger.warning("API key format appears invalid after reload")
                        self.api_disabled = True
                        return False
                    logger.info("API key reloaded successfully from database settings")
                    return True
                except Exception as e:
                    logger.error(f"Failed to reinitialize Groq client after reload: {e}")
                    self.client = None
                    self.api_disabled = True
                    return False
        except Exception as e:
            logger.error(f"Error reloading API key: {e}")
            return False
    
    def _mark_api_failure(self, error: Exception) -> None:
        """Mark API failure and disable client if too many failures (especially 401 errors)"""
        error_msg = str(error)
        # Immediately disable on 401 (invalid API key) - this is critical
        if '401' in error_msg or 'invalid_api_key' in error_msg.lower() or 'unauthorized' in error_msg.lower():
            if not self.api_disabled:
                logger.warning("API key appears invalid (401 error), disabling LLM and using rule-based fallback")
                self.api_disabled = True
                # Also set client to None to prevent further attempts
                self.client = None
        else:
            # For other errors, count failures
            self.api_failure_count += 1
            if self.api_failure_count >= 3:
                logger.warning(f"Multiple API failures ({self.api_failure_count}), disabling LLM and using rule-based fallback")
                self.api_disabled = True
    
    def _handle_api_error(self, error: Exception, operation: str) -> None:
        """Handle API errors with appropriate logging"""
        error_msg = str(error)
        if '401' in error_msg or 'invalid_api_key' in error_msg.lower() or 'unauthorized' in error_msg.lower():
            logger.error(f"{operation} error: Invalid or expired API key. Please check your GROQ_API_KEY setting.")
        elif '429' in error_msg or 'rate_limit' in error_msg.lower():
            logger.warning(f"{operation} error: Rate limit exceeded. Please try again later.")
        else:
            logger.error(f"{operation} error: {error}")
    
    def _build_graph(self) -> StateGraph:
        """Build comprehensive LangGraph workflow"""
        
        workflow = StateGraph(ConversationState)
        
        # Add all nodes
        workflow.add_node("intent_classifier", self.intent_classifier_node)
        workflow.add_node("form_router", self.form_router_node)
        workflow.add_node("data_extractor", self.data_extractor_node)
        workflow.add_node("question_generator", self.question_generator_node)
        workflow.add_node("validator", self.validator_node)
        workflow.add_node("response_generator", self.response_generator_node)
        
        # Set entry point
        workflow.set_entry_point("intent_classifier")
        
        # Define conditional routing
        workflow.add_conditional_edges(
            "intent_classifier",
            self._route_after_intent,
            {
                "form_flow": "form_router",
                "general": "response_generator",
                "extract_data": "data_extractor"
            }
        )
        
        workflow.add_conditional_edges(
            "form_router",
            self._route_after_form_router,
            {
                "start_form": "question_generator",
                "extract_data": "data_extractor",
                "validate": "validator",
                "general": "response_generator"
            }
        )
        
        workflow.add_conditional_edges(
            "data_extractor",
            self._route_after_extraction,
            {
                "next_question": "question_generator",
                "validate": "validator",
                "complete": "response_generator"
            }
        )
        
        workflow.add_conditional_edges(
            "validator",
            self._route_after_validation,
            {
                "confirm": "response_generator",
                "ask_question": "question_generator"
            }
        )
        
        workflow.add_edge("question_generator", END)
        workflow.add_edge("response_generator", END)
        
        return workflow.compile(checkpointer=self.memory)
    
    # ==================== NODE IMPLEMENTATIONS ====================
    
    def intent_classifier_node(self, state: ConversationState) -> ConversationState:
        """LLM-based intent classification node"""
        logger.info(f"Intent classifier node for session {state['session_id']}")
        
        try:
            message = state.get('current_message', '')
            current_form = state.get('current_form')
            collected_data = state.get('collected_data', {})
            conversation_history = state.get('messages', [])[-5:]  # Last 5 messages
            
            # If already in a form, check if user wants to do something else
            if current_form:
                # Check if message looks like a new intent request (not a field value)
                message_lower = message.lower().strip()
                intent_keywords = ['wanna', 'want', 'need', 'help', 'hire', 'buy', 'sell', 'claim', 'contact', 'subscribe', 'unsubscribe', 'testimonial', 'review']
                
                # If message contains intent keywords and doesn't look like a field value, check for new intent
                looks_like_new_intent = any(keyword in message_lower for keyword in intent_keywords) and len(message) > 5
                
                if looks_like_new_intent:
                    # Check if current form is complete
                    form_info = self.form_schemas.get(current_form, {})
                    required_fields = form_info.get('required_fields', [])
                    missing_fields = [f for f in required_fields if f not in collected_data or not collected_data.get(f)]
                    
                    if missing_fields:
                        # Form is incomplete, continue with current form
                        state['intent'] = current_form
                        state['confidence'] = 1.0
                        state['intent_reasoning'] = f"Already in active form ({current_form}), continuing to collect missing fields"
                        state['next_node'] = 'form_flow'
                        logger.info(f"Form active but incomplete, continuing with: {current_form}")
                        return state
                    else:
                        # Form is complete, allow new intent classification
                        logger.info(f"Form {current_form} appears complete, allowing new intent classification")
                        # Continue to intent classification below
                else:
                    # Message doesn't look like new intent, continue with current form
                    state['intent'] = current_form
                    state['confidence'] = 1.0
                    state['intent_reasoning'] = "Already in active form"
                    state['next_node'] = 'form_flow'
                    logger.info(f"Skipping intent classification, already in form: {current_form}")
                    return state
            
            # Build form descriptions for LLM
            form_descriptions = []
            for form_type, form_info in self.form_schemas.items():
                form_descriptions.append(f"- {form_type}: {form_info['title']} - {form_info['description']}")
            
            prompt = f"""
You are an intent classification assistant for a car hire management chatbot.

AVAILABLE FORMS:
{chr(10).join(form_descriptions)}

USER MESSAGE: {message}

CONVERSATION HISTORY:
{self._format_history(conversation_history)}

Analyze the user's message and determine their intent. Return a JSON object with:
{{
    "intent": "form_type_key or 'general'",
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
}}

Intent classification rules:
- If user wants to sell/valuation/trade-in → "car_sell"
- If user wants to buy/purchase → "car_purchase"
- If user had accident/needs claim → "make_claim"
- If user wants to contact/ask questions → "contact"
- If user wants to subscribe to newsletter → "newsletter_subscribe"
- If user wants to unsubscribe → "newsletter_unsubscribe"
- If user wants to leave review/feedback → "testimonial"
- Otherwise → "general"

Return ONLY valid JSON, no other text.
"""
            
            if not self._is_client_available():
                logger.error("Groq client not available for intent classification")
                state['intent'] = 'general'
                state['confidence'] = 0.3
                state['intent_reasoning'] = "API unavailable - using fallback"
                state['next_node'] = 'general'
                return state
            
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are an intent classification assistant. CRITICAL: You MUST return ONLY valid JSON, nothing else. NO thinking, NO reasoning, NO explanations, NO markdown, NO tags, NO text before or after. ONLY return: {\"intent\": \"form_type\", \"confidence\": 0.0-1.0, \"reasoning\": \"brief\"}. Start with { and end with }. Do not use <think>, <reasoning>, <think>, or any tags. Do not explain your process. Just return the JSON object."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=200,
                    temperature=0.1
                )
            except Exception as e:
                self._handle_api_error(e, "Intent classification")
                self._mark_api_failure(e)  # Track failure and disable if needed
                state['intent'] = 'general'
                state['confidence'] = 0.3
                state['intent_reasoning'] = f"API error: {str(e)[:50]}"
                state['next_node'] = 'general'
                return state
            
            # Check if response has content
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from Groq API for intent classification")
                state['intent'] = 'general'
                state['confidence'] = 0.3
                state['intent_reasoning'] = "Empty API response"
                state['next_node'] = 'general'
                return state
            
            result_text = response.choices[0].message.content.strip()
            
            # Log raw response for debugging
            if not result_text:
                logger.error("Empty result text after stripping")
                state['intent'] = 'general'
                state['confidence'] = 0.3
                state['intent_reasoning'] = "Empty response text"
                state['next_node'] = 'general'
                return state
            
            # Clean response: Remove thinking/reasoning tags before JSON extraction
            result_text = self._clean_response_for_json(result_text)
            
            # Use robust JSON extraction
            result = self._extract_json_from_text(result_text)
            
            if result:
                intent = result.get('intent', 'general')
                confidence = float(result.get('confidence', 0.5))
                reasoning = result.get('reasoning', '')
                
                # Validate intent is a valid form type
                if intent not in self.form_schemas and intent != 'general':
                    logger.warning(f"Invalid intent '{intent}', defaulting to 'general'")
                    intent = 'general'
                    confidence = 0.3
                
                state['intent'] = intent
                state['confidence'] = confidence
                state['intent_reasoning'] = reasoning
                
                # Determine next node
                if intent in self.form_schemas:
                    state['next_node'] = 'form_flow'
                else:
                    state['next_node'] = 'general'
                
                logger.info(f"Intent classified: {intent} (confidence: {confidence})")
            else:
                logger.error(f"Failed to extract JSON from intent classification response")
                logger.error(f"Raw response text: {repr(result_text[:200])}")  # Log first 200 chars
                state['intent'] = 'general'
                state['confidence'] = 0.3
                state['intent_reasoning'] = "Failed to parse JSON response"
                state['next_node'] = 'general'
            
        except Exception as e:
            logger.error(f"Intent classification error: {e}")
            state['intent'] = 'general'
            state['confidence'] = 0.3
            state['next_node'] = 'general'
        
        return state
    
    def form_router_node(self, state: ConversationState) -> ConversationState:
        """Routes to appropriate form handling based on current state"""
        logger.info(f"Form router node for session {state['session_id']}")
        
        intent = state.get('intent')
        current_form = state.get('current_form')
        current_step = state.get('current_step')
        collected_data = state.get('collected_data', {})
        required_fields = state.get('required_fields', [])
        current_message = state.get('current_message', '').strip()
        
        # If no form is active but we have an intent, start the form
        if not current_form and intent in self.form_schemas:
            state['current_form'] = intent
            state['is_form_active'] = True
            form_info = self.form_schemas[intent]
            required_fields = form_info['required_fields'].copy()
            
            # Pre-populate form with conversation user info
            user_info = state.get('user_info', {})
            collected_data = {}
            completed_fields = []
            
            # Map conversation user info to form fields
            if user_info.get('name'):
                # Try to match to form field names
                for field in ['name', 'full_name', 'first_name']:
                    if field in required_fields:
                        collected_data[field] = user_info['name']
                        completed_fields.append(field)
                        if field in required_fields:
                            required_fields.remove(field)
                        break
            
            if user_info.get('email') and 'email' in required_fields:
                collected_data['email'] = user_info['email']
                completed_fields.append('email')
                required_fields.remove('email')
            
            if user_info.get('phone') and 'phone' in required_fields:
                collected_data['phone'] = user_info['phone']
                completed_fields.append('phone')
                required_fields.remove('phone')
            
            state['required_fields'] = required_fields
            state['collected_data'] = collected_data
            state['completed_fields'] = completed_fields
            state['next_node'] = 'start_form'
            logger.info(f"Starting form: {intent}, pre-populated {len(completed_fields)} fields")
        
        # If form is active and we have a current step, extract data
        elif current_form and current_step:
            state['next_node'] = 'extract_data'
        
        # If form is active and no current step, check if we need to validate or ask questions
        elif current_form:
            # Recalculate missing fields
            form_info = self.form_schemas[current_form]
            required_fields = [f for f in form_info['required_fields'] 
                             if f not in collected_data or not collected_data.get(f)]
            state['required_fields'] = required_fields
            
            if not required_fields:
                # All required fields collected, validate
                state['next_node'] = 'validate'
            else:
                # Try to extract ALL possible missing fields from the message
                # This is schema-driven - uses the form model to extract as much as possible
                missing_fields = required_fields.copy()
                extracted_fields = self._extract_multiple_fields_from_message(
                    current_message, missing_fields, current_form, collected_data
                )
                
                if extracted_fields:
                    # Update collected data with all extracted fields
                    for field_name, field_value in extracted_fields.items():
                        if field_value and field_name in missing_fields:
                            collected_data[field_name] = field_value
                            if field_name not in state.get('completed_fields', []):
                                state.setdefault('completed_fields', []).append(field_name)
                    
                    state['collected_data'] = collected_data
                    
                    # Recalculate remaining fields
                    remaining_fields = [f for f in form_info['required_fields'] 
                                      if f not in collected_data or not collected_data.get(f)]
                    state['required_fields'] = remaining_fields
                    
                    logger.info(f"Extracted {len(extracted_fields)} fields from message: {list(extracted_fields.keys())}")
                    
                    if not remaining_fields:
                        # All fields collected, validate
                        state['next_node'] = 'validate'
                    else:
                        # Still have missing fields, ask next question
                        state['next_node'] = 'start_form'
                else:
                    # No fields extracted, need to ask next question
                    state['next_node'] = 'start_form'
        
        else:
            state['next_node'] = 'general'
        
        return state
    
    def data_extractor_node(self, state: ConversationState) -> ConversationState:
        """Extracts field values from user messages using form schema"""
        logger.info(f"Data extractor node for session {state['session_id']}")
        
        current_form = state.get('current_form')
        current_step = state.get('current_step')
        current_message = state.get('current_message', '')
        collected_data = state.get('collected_data', {})
        completed_fields = state.get('completed_fields', [])
        
        if not current_form:
            state['next_node'] = 'general'
            return state
        
        # Get form schema
        form_info = self.form_schemas.get(current_form)
        if not form_info:
            state['next_node'] = 'general'
            return state
        
        # Get all missing required fields
        missing_fields = [f for f in form_info['required_fields'] 
                         if f not in collected_data or not collected_data.get(f)]
        
        # If we have a current_step, extract that specific field
        if current_step and current_step in missing_fields:
            extracted_value = self._extract_field_value(current_message, current_step, current_form)
            
            if extracted_value:
                collected_data[current_step] = extracted_value
                if current_step not in completed_fields:
                    completed_fields.append(current_step)
                logger.info(f"Extracted {current_step} = {extracted_value}")
        
        # Also try to extract ALL other missing fields from the message
        # This is schema-driven - uses the form model to extract as much as possible
        remaining_missing = [f for f in missing_fields if f != current_step]
        if remaining_missing:
            extracted_fields = self._extract_multiple_fields_from_message(
                current_message, remaining_missing, current_form, collected_data
            )
            
            if extracted_fields:
                for field_name, field_value in extracted_fields.items():
                    if field_value and field_name in remaining_missing:
                        collected_data[field_name] = field_value
                        if field_name not in completed_fields:
                            completed_fields.append(field_name)
                        logger.info(f"Extracted {field_name} = {field_value}")
        
        # Update state
        state['collected_data'] = collected_data
        state['completed_fields'] = completed_fields
        state['current_step'] = None  # Clear current step
        
        # Recalculate missing fields
        required_fields = [f for f in form_info['required_fields'] 
                         if f not in collected_data or not collected_data.get(f)]
        state['required_fields'] = required_fields
        
        if not required_fields:
            # All fields collected, validate
            state['next_node'] = 'validate'
        else:
            # Ask next question
            state['next_node'] = 'next_question'
        
        return state
    
    def question_generator_node(self, state: ConversationState) -> ConversationState:
        """Generates next question for form collection based on collected vs remaining fields"""
        logger.info(f"Question generator node for session {state['session_id']}")
        
        current_form = state.get('current_form')
        required_fields = state.get('required_fields', [])
        collected_data = state.get('collected_data', {})
        form_info = self.form_schemas.get(current_form, {})
        
        if not current_form or not required_fields:
            # No more questions needed
            state['response'] = "Thank you! I have all the information I need."
            state['response_type'] = 'general'
            state['next_node'] = 'end'
            return state
        
        # Calculate progress
        total_required = len(form_info.get('required_fields', []))
        collected_count = len(collected_data)
        remaining_count = len(required_fields)
        
        # Get next field to ask
        next_field = required_fields[0]
        state['current_step'] = next_field
        
        # Get question for this field
        question = self.form_questions.get(current_form, {}).get(
            next_field,
            f"Could you please provide your {next_field.replace('_', ' ')}?"
        )
        
        # Build contextual response based on progress
        form_title = form_info.get('title', 'form')
        
        # If just starting, welcome message
        if collected_count == 0:
            response = f"I'd be happy to help you with {form_title}. {question}"
        # If making progress, acknowledge and continue
        elif collected_count > 0 and remaining_count > 1:
            response = f"Great! {question} ({collected_count} of {total_required} completed)"
        # If almost done, encourage
        elif remaining_count == 1:
            response = f"Almost there! {question} (just 1 more field needed)"
        else:
            response = question
        
        state['response'] = response
        state['response_type'] = 'question'
        state['next_node'] = 'end'
        
        return state
    
    def validator_node(self, state: ConversationState) -> ConversationState:
        """Validates collected data"""
        logger.info(f"Validator node for session {state['session_id']}")
        
        current_form = state.get('current_form')
        collected_data = state.get('collected_data', {})
        
        if not current_form:
            state['next_node'] = 'end'
            return state
        
        # Validate all required fields
        form_info = self.form_schemas[current_form]
        validation_errors = []
        
        for field in form_info['required_fields']:
            if field not in collected_data or not collected_data.get(field):
                validation_errors.append(field)
        
        if validation_errors:
            # Missing fields, ask for them
            state['required_fields'] = validation_errors
            state['next_node'] = 'ask_question'
        else:
            # All valid, ready for confirmation
            state['next_node'] = 'confirm'
        
        return state
    
    def response_generator_node(self, state: ConversationState) -> ConversationState:
        """Generates final response"""
        logger.info(f"Response generator node for session {state['session_id']}")
        
        next_node = state.get('next_node')
        current_form = state.get('current_form')
        collected_data = state.get('collected_data', {})
        intent = state.get('intent', 'general')
        conversation_history = state.get('messages', [])
        
        # If we need confirmation
        if next_node == 'confirm' and current_form:
            # Generate clear confirmation message
            form_info = self.form_schemas.get(current_form, {})
            form_title = form_info.get('title', 'form')
            
            # Create user-friendly field labels
            field_labels = {
                'name': 'Name',
                'full_name': 'Full Name',
                'first_name': 'First Name',
                'last_name': 'Last Name',
                'email': 'Email',
                'phone': 'Phone',
                'vehicle_make': 'Vehicle Make',
                'vehicle_model': 'Vehicle Model',
                'vehicle_year': 'Vehicle Year',
                'mileage': 'Mileage',
                'message': 'Message',
                'subject': 'Subject',
                'feedback': 'Feedback',
                'rating': 'Rating',
                'accident_date': 'Accident Date',
                'vehicle_registration': 'Vehicle Registration',
                'insurance_company': 'Insurance Company',
                'policy_number': 'Policy Number',
                'accident_details': 'Accident Details',
                'pickup_location': 'Pickup Location',
                'dropoff_location': 'Dropoff Location',
                'full_address': 'Address',
                'additional_notes': 'Additional Notes',
                'offer_price': 'Offer Price',
                'financing_required': 'Financing Required',
                'trade_in_details': 'Trade-in Details',
                'service_used': 'Service Used'
            }
            
            summary = f"Perfect! Let me confirm the information you've provided for your {form_title}:\n\n"
            for field, value in collected_data.items():
                field_label = field_labels.get(field, field.replace('_', ' ').title())
                # Format value nicely
                if isinstance(value, bool):
                    display_value = "Yes" if value else "No"
                else:
                    display_value = str(value)
                summary += f"• **{field_label}**: {display_value}\n"
            summary += "\nDoes this look correct? Please reply 'yes' to submit or 'no' to make changes."
            
            state['response'] = summary
            state['response_type'] = 'confirmation'
            state['requires_confirmation'] = True
            state['next_node'] = 'end'
            return state
        
        # Generate general response based on intent
        message = state.get('current_message', '')
        
        if intent in self.form_schemas:
            form_info = self.form_schemas[intent]
            response = f"I'd be happy to help you with {form_info['title']}. Let me collect some information from you."
        else:
            # Use LLM for general response with conversation history
            response = self._generate_general_response(message, intent, conversation_history, state)
        
        state['response'] = response
        state['response_type'] = 'general'
        state['next_node'] = 'end'
        
        return state
    
    # ==================== ROUTING FUNCTIONS ====================
    
    def _route_after_intent(self, state: ConversationState) -> str:
        """Route after intent classification"""
        return state.get('next_node', 'general')
    
    def _route_after_form_router(self, state: ConversationState) -> str:
        """Route after form router"""
        next_node = state.get('next_node', 'general')
        if next_node == 'start_form':
            return 'start_form'
        elif next_node == 'extract_data':
            return 'extract_data'
        elif next_node == 'validate':
            return 'validate'
        else:
            return 'general'
    
    def _route_after_extraction(self, state: ConversationState) -> str:
        """Route after data extraction"""
        next_node = state.get('next_node', 'next_question')
        if next_node == 'validate':
            return 'validate'
        elif next_node == 'complete':
            return 'complete'
        else:
            return 'next_question'
    
    def _route_after_validation(self, state: ConversationState) -> str:
        """Route after validation"""
        next_node = state.get('next_node', 'end')
        if next_node == 'confirm':
            return 'confirm'
        elif next_node == 'ask_question':
            return 'ask_question'
        else:
            return 'end'
    
    # ==================== HELPER METHODS ====================
    
    def _clean_response_for_json(self, text: str) -> str:
        """Clean response text to remove thinking/reasoning tags before JSON extraction"""
        if not text:
            return text
        
        # Remove all thinking/reasoning tags and their content (most aggressive)
        thinking_patterns = [
            r'<redacted_reasoning[^>]*>.*?</redacted_reasoning[^>]*>',
            r'<redacted[^>]*>.*?</redacted[^>]*>',
            r'<think[^>]*>.*?</think[^>]*>',
            r'<thinking[^>]*>.*?</thinking[^>]*>',
            r'<reasoning[^>]*>.*?</reasoning[^>]*>',
            r'<parse[^>]*>.*?</parse[^>]*>',
            r'<observation[^>]*>.*?</observation[^>]*>',
            r'\[think[^\]]*\].*?\[/think[^\]]*\]',
            r'\[thinking[^\]]*\].*?\[/thinking[^\]]*\]',
            r'\[reasoning[^\]]*\].*?\[/reasoning[^\]]*\]',
            r'\[redacted[^\]]*\].*?\[/redacted[^\]]*\]',
        ]
        
        cleaned = text
        for pattern in thinking_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE | re.DOTALL | re.MULTILINE)
        
        # Remove any remaining tag-like content
        cleaned = re.sub(r'<[^>]*>', '', cleaned)
        cleaned = re.sub(r'\[[^\]]*\]', '', cleaned)
        
        # Remove lines that start with thinking indicators
        lines = cleaned.split('\n')
        filtered_lines = []
        for line in lines:
            line_lower = line.strip().lower()
            # Skip lines that are clearly thinking/reasoning
            if any(indicator in line_lower for indicator in [
                'okay, let\'s see', 'okay let\'s see', 'let me think', 'i need to',
                'looking at', 'first,', 'check the', 'the user sent', 'the message is'
            ]) and not line.strip().startswith('{'):
                continue
            filtered_lines.append(line)
        
        cleaned = '\n'.join(filtered_lines).strip()
        
        return cleaned
    
    def _extract_json_from_text(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON object from text, handling various formats"""
        if not text:
            return None
        
        # Try direct JSON parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        
        # Try to find JSON object in text - improved regex to handle nested objects
        # Find the first complete JSON object (balanced braces)
        brace_count = 0
        start_idx = -1
        for i, char in enumerate(text):
            if char == '{':
                if start_idx == -1:
                    start_idx = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and start_idx != -1:
                    # Found complete JSON object
                    json_str = text[start_idx:i+1]
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        pass
                    start_idx = -1
        
        # Fallback: Try simpler regex pattern
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        
        # Try to extract just the JSON part if text has extra content
        # Look for lines that look like JSON
        lines = text.split('\n')
        json_lines = []
        in_json = False
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('{') or in_json:
                in_json = True
                json_lines.append(line)
                if stripped.endswith('}') and stripped.count('{') <= stripped.count('}'):
                    break
        
        if json_lines:
            try:
                return json.loads('\n'.join(json_lines))
            except json.JSONDecodeError:
                pass
        
        return None
    
    def _message_looks_like_field_value(self, message: str, field_name: str, form_type: str) -> bool:
        """Check if message looks like it contains a field value"""
        if not message or not field_name or not form_type:
            return False
        
        # Get field schema to know what type we're looking for
        field_schema = None
        if form_type in self.form_schemas:
            field_schema = self.form_schemas[form_type]['validation'].get(field_name, {})
        
        field_type = field_schema.get('type', 'string') if field_schema else 'string'
        
        # Quick pattern matching for common field types
        if field_type == 'email':
            # Check if message looks like an email (contains @ and .)
            email_pattern = r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
            if re.search(email_pattern, message):
                return True
        
        elif field_type == 'phone':
            # Check if message contains mostly digits (phone-like)
            digits = re.sub(r'[^\d]', '', message)
            if len(digits) >= 7:  # Minimum phone length
                return True
        
        elif field_type in ['string', 'text']:
            # For string fields, if message is short and doesn't look like a question/command, it might be a value
            # Exclude common question words and commands
            question_words = ['what', 'where', 'when', 'who', 'why', 'how', 'can', 'could', 'would', 'should', 'wanna', 'want', 'need', 'help']
            message_lower = message.lower().strip()
            # If message is short (less than 50 chars) and doesn't start with question words, might be a value
            if len(message) < 50 and not any(message_lower.startswith(word) for word in question_words):
                # Check if it's not a complete sentence (no question marks, exclamation marks at end)
                if not message_lower.endswith('?') and not message_lower.endswith('!'):
                    return True
        
        return False
    
    def _extract_multiple_fields_from_message(self, message: str, field_names: List[str], form_type: str, collected_data: Dict[str, Any]) -> Dict[str, Optional[str]]:
        """
        Extract multiple field values from a single message using form schema.
        Schema-driven approach - uses the form model to extract as much as possible.
        """
        if not message or not field_names or not form_type:
            return {}
        
        if form_type not in self.form_schemas:
            return {}
        
        form_info = self.form_schemas[form_type]
        validation_rules = form_info.get('validation', {})
        
        # Build field descriptions for LLM
        field_descriptions = []
        for field_name in field_names:
            field_schema = validation_rules.get(field_name, {})
            field_type = field_schema.get('type', 'string')
            field_desc = f"- {field_name} ({field_type})"
            if 'min_length' in field_schema:
                field_desc += f", min length: {field_schema['min_length']}"
            if 'max_length' in field_schema:
                field_desc += f", max length: {field_schema['max_length']}"
            if 'options' in field_schema:
                field_desc += f", options: {', '.join(field_schema['options'])}"
            field_descriptions.append(field_desc)
        
        # Build prompt with form context
        prompt = f"""
Extract field values from the following user message based on the form schema.

FORM TYPE: {form_info['title']}
FORM DESCRIPTION: {form_info['description']}

USER MESSAGE: {message}

FIELDS TO EXTRACT (only extract if present in message):
{chr(10).join(field_descriptions)}

ALREADY COLLECTED DATA (for context, do not re-extract):
{json.dumps(collected_data, indent=2) if collected_data else "None"}

Instructions:
1. Extract ONLY fields that are clearly present in the message
2. For each field, use the validation rules to extract the correct value
3. If a field is not found in the message, use null for that field
4. Do not make assumptions or infer values
5. Return as JSON: {{"field_name": "value or null", "field_name2": "value2 or null"}}
6. Clean and normalize values (remove extra spaces, etc.)

Return ONLY valid JSON, no other text:
"""
        
        if not self._is_client_available():
            logger.error("Groq client not available for data extraction")
            return {}
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a data extraction assistant. Extract multiple field values from user messages based on form schemas. Return ONLY valid JSON in format: {\"field_name\": \"value or null\"}. Do not include thinking, reasoning, or any other text."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.1
            )
            
            # Check if response has content
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from Groq API for multi-field extraction")
                return {}
            
            result_text = response.choices[0].message.content.strip()
            result_text = self._clean_response_for_json(result_text)
            result = self._extract_json_from_text(result_text)
            
            if result and isinstance(result, dict):
                # Validate and clean extracted values
                validated_result = {}
                for field_name in field_names:
                    value = result.get(field_name)
                    if value and str(value).strip() and str(value).upper() != "NOT_FOUND" and str(value).lower() != "null":
                        # Validate against schema
                        field_schema = validation_rules.get(field_name, {})
                        if self._validate_field_value(field_name, str(value).strip(), field_schema):
                            validated_result[field_name] = str(value).strip()
                
                return validated_result
            
            return {}
        except Exception as e:
            self._handle_api_error(e, "Contact info extraction")
            self._mark_api_failure(e)  # Track failure and disable if needed
            logger.error(f"Multi-field extraction error: {e}")
            return {}
    
    def _validate_field_value(self, field_name: str, value: str, field_schema: Dict[str, Any]) -> bool:
        """Validate a field value against its schema"""
        if not value:
            return False
        
        field_type = field_schema.get('type', 'string')
        
        # Type-specific validation
        if field_type == 'email':
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            return bool(re.match(email_pattern, value))
        
        elif field_type == 'phone':
            digits_only = re.sub(r'[^\d]', '', value)
            return len(digits_only) >= 7
        
        elif field_type == 'string' or field_type == 'text':
            if 'min_length' in field_schema and len(value) < field_schema['min_length']:
                return False
            if 'max_length' in field_schema and len(value) > field_schema['max_length']:
                return False
            return True
        
        elif field_type == 'integer':
            try:
                int_val = int(value)
                if 'min' in field_schema and int_val < field_schema['min']:
                    return False
                if 'max' in field_schema and int_val > field_schema['max']:
                    return False
                return True
            except ValueError:
                return False
        
        elif field_type == 'select':
            if 'options' in field_schema:
                return value in field_schema['options']
        
        return True
    
    def _extract_field_value(self, message: str, field_name: str, form_type: str) -> Optional[str]:
        """Extract field value from user message using LLM"""
        if not message or not field_name or not form_type:
            return None
        
        field_schema = None
        if form_type in self.form_schemas:
            field_schema = self.form_schemas[form_type]['validation'].get(field_name, {})
        
        prompt = f"""
Extract the {field_name} value from the following user message.

USER MESSAGE: {message}
FIELD NAME: {field_name}
FORM TYPE: {form_type}
FIELD TYPE: {field_schema.get('type', 'string') if field_schema else 'string'}

Instructions:
1. Extract ONLY the value for {field_name} from the message
2. For names: Extract the full name (first and last if provided)
3. For emails: Extract the email address
4. For phones: Extract the phone number
5. Return ONLY the extracted value, nothing else
6. If the message doesn't contain the requested field value, return "NOT_FOUND"
7. Clean and normalize the value (remove extra spaces, etc.)

Return ONLY the extracted value (or "NOT_FOUND" if not found):
"""
        
        if not self._is_client_available():
            logger.error("Groq client not available for field extraction")
            return "NOT_FOUND"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a data extraction assistant. Extract field values from user messages. Return ONLY the extracted value, nothing else."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.1
            )
            
            # Check if response has content
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from Groq API for field extraction")
                return None
            
            extracted = response.choices[0].message.content.strip()
            
            # Remove quotes
            if extracted.startswith('"') and extracted.endswith('"'):
                extracted = extracted[1:-1]
            if extracted.startswith("'") and extracted.endswith("'"):
                extracted = extracted[1:-1]
            
            if extracted.upper() == "NOT_FOUND" or not extracted:
                return None
            
            # Basic validation
            if field_schema:
                field_type = field_schema.get('type')
                if field_type == 'email':
                    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                    if not re.match(email_pattern, extracted):
                        return None
                elif field_type == 'phone':
                    digits_only = extracted.replace(' ', '').replace('-', '').replace('+', '').replace('(', '').replace(')', '')
                    if not digits_only.isdigit() or len(digits_only) < 7:
                        return None
            
            return extracted
        except Exception as e:
            self._handle_api_error(e, "Field extraction")
            self._mark_api_failure(e)  # Track failure and disable if needed
            logger.error(f"Field extraction error for {field_name}: {e}")
            # Fallback: try direct pattern matching for common field types
            if field_schema:
                field_type = field_schema.get('type')
                if field_type == 'email':
                    # Try to extract email using regex
                    email_pattern = r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
                    email_match = re.search(email_pattern, message)
                    if email_match:
                        return email_match.group(0)
                elif field_type == 'phone':
                    # Try to extract phone using regex
                    phone_pattern = r'[\d\s\+\-\(\)]{7,}'
                    phone_match = re.search(phone_pattern, message)
                    if phone_match:
                        phone = phone_match.group(0).strip()
                        digits_only = re.sub(r'[^\d]', '', phone)
                        if len(digits_only) >= 7:
                            return phone.strip()
            # Fallback for name fields
            if field_name in ['name', 'full_name', 'first_name', 'last_name'] and len(message.strip()) < 50:
                return message.strip()
            return None
    
    def _extract_contact_info(self, message: str, conversation_history: List[Dict] = None) -> Dict[str, Optional[str]]:
        """Extract contact information (name, email, phone) from any message"""
        if not message:
            return {}
        
        # Quick regex checks first
        email_pattern = r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b'
        phone_pattern = r'[\d\s\+\-\(\)]{7,}'
        
        extracted = {}
        
        # Extract email
        email_match = re.search(email_pattern, message)
        if email_match:
            extracted['email'] = email_match.group(0)
        
        # Extract phone
        phone_match = re.search(phone_pattern, message)
        if phone_match:
            phone = phone_match.group(0).strip()
            digits_only = re.sub(r'[^\d]', '', phone)
            if len(digits_only) >= 7:
                extracted['phone'] = phone
        
        # Use LLM to extract name and verify/improve email/phone
        prompt = f"""
Extract contact information from this user message.

MESSAGE: {message}

Extract:
1. Name (full name, first name, or any name mentioned)
2. Email address (if present)
3. Phone number (if present)

Return ONLY a JSON object: {{"name": "value or null", "email": "value or null", "phone": "value or null"}}
If information is not found, use null. Do not make up information.
"""
        
        if not self._is_client_available():
            logger.error("Groq client not available for contact info extraction")
            return extracted  # Return regex-extracted data only
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a data extraction assistant. Extract contact information. Return ONLY valid JSON: {\"name\": \"value or null\", \"email\": \"value or null\", \"phone\": \"value or null\"}. No other text."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.1
            )
            
            # Check if response has content
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from Groq API for contact info extraction")
                return extracted  # Return regex-extracted data only
            
            result_text = response.choices[0].message.content.strip()
            result_text = self._clean_response_for_json(result_text)
            result = self._extract_json_from_text(result_text)
            
            if result:
                # Merge with regex results (prefer LLM results)
                if result.get('name'):
                    extracted['name'] = result['name']
                if result.get('email'):
                    extracted['email'] = result['email']
                if result.get('phone'):
                    extracted['phone'] = result['phone']
        except Exception as e:
            self._handle_api_error(e, "Contact info extraction")
            self._mark_api_failure(e)  # Track failure and disable if needed
            logger.error(f"Contact info extraction error: {e}")
            # Return regex-extracted data only on error
            return extracted
        
        return extracted
    
    def _generate_general_response(self, message: str, intent: str, conversation_history: List[Dict] = None, state: ConversationState = None) -> str:
        """Generate general response using LLM with conversation history context"""
        if conversation_history is None:
            conversation_history = []
        
        # Build comprehensive context from all available sections
        # This ensures the chatbot has access to all information
        context_parts = []
        
        # Add all context sections in display order
        sorted_sections = sorted(
            self.context_sections.items(),
            key=lambda x: x[1].get('display_order', 999)
        )
        
        for section_key, section_data in sorted_sections:
            context_parts.append(f"=== {section_data['title']} ===\n{section_data['content']}")
        
        context_content = "\n\n".join(context_parts) if context_parts else ""
        
        # If no context loaded, use a basic fallback
        if not context_content:
            context_content = "Prestige Car Hire Management - Car hire and vehicle rental services."
        
        # Check for office location in context
        has_location_info = False
        if 'contact' in self.context_sections:
            contact_context = self.context_sections['contact']['content']
            if 'address' in contact_context.lower() or 'location' in contact_context.lower():
                has_location_info = True
        
        # Format conversation history (use last 10 messages for better context)
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        history_context = self._format_history(recent_history)
        
        # Build available services list
        available_services = []
        for form_type, form_info in self.form_schemas.items():
            available_services.append(f"- {form_info['title']}: {form_info['description']}")
        
        # Add validation instruction for location requests
        location_instruction = ""
        if 'location' in message.lower() or 'address' in message.lower() or 'office' in message.lower():
            if not has_location_info:
                location_instruction = "\nCRITICAL: If user asks for office location/address and you don't have this information in the context, say 'I don't have the office address information available. Please contact us at info@prestigecarhire.co.uk for the exact location.' DO NOT make up or invent an address."
        
        prompt = f"""
You are a professional customer service chatbot for Prestige Car Hire Management.

CONVERSATION HISTORY:
{history_context}

COMPLETE COMPANY CONTEXT (Use all relevant information from these sections):
{context_content}

AVAILABLE SERVICES:
{chr(10).join(available_services)}

CURRENT USER MESSAGE: {message}

CLASSIFIED INTENT: {intent}
{location_instruction}

Instructions:
1. Be professional, helpful, and friendly
2. Use the conversation history to understand context and maintain continuity
3. Reference previous exchanges when relevant
4. Use ALL the provided context sections to give accurate and comprehensive information - ONLY use information that exists in the context
5. Draw from multiple context sections when relevant (e.g., if asked about pricing, you can reference both pricing and services sections)
6. If you don't have specific information (like office address), say so honestly - DO NOT make up information
7. If the user is asking about services you don't have context for, politely redirect to available services
8. If this seems like a lead or potential customer, be engaging and offer to help further
9. Keep responses concise but informative (2-4 sentences)
10. If appropriate, suggest next steps or ask clarifying questions
11. Maintain conversation flow naturally
12. CRITICAL: If the user says goodbye, thanks, "bye", or tries to end the conversation, respond warmly: "You're welcome! I'm always here whenever you need anything or have any questions. Feel free to reach out anytime!" ALWAYS keep the conversation open and welcoming - NEVER say a final goodbye.
13. CRITICAL: Respond with ONLY your final answer. Do NOT include any thinking, reasoning, parsing, observation, or internal process. Do NOT use tags like <thinking>, <reasoning>, <think>, or show any reasoning steps. Just provide a direct, helpful response immediately.
14. Ensure your response is complete - do not cut off mid-sentence.

Generate a helpful, professional response that acknowledges the conversation history and provides relevant information from the context:
"""
        
        if not self._is_client_available():
            logger.error("Groq client not initialized - API key missing")
            return "I'm here to help with car hire and related services. How can I assist you today?"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional customer service chatbot. Be helpful, accurate, and engaging. CRITICAL RULES: 1) NEVER end conversations - always keep them open. If users say goodbye or thanks, respond warmly that you're always here and available. 2) NEVER make up information - if you don't know something, say so. 3) Use conversation history to maintain context. 4) Respond with ONLY your final answer - no thinking, reasoning, or tags. 5) Ensure responses are complete and not truncated."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            # Check if response has content
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from Groq API for general response")
                return "I'm here to help with car hire and related services. How can I assist you today?"
            
            raw_response = response.choices[0].message.content.strip()
            cleaned = self._clean_response(raw_response)
            
            # Validate response is complete (not truncated)
            if len(cleaned) < 10 or cleaned.endswith('...') or (not cleaned.endswith('.') and not cleaned.endswith('!') and not cleaned.endswith('?')):
                # Response might be incomplete, but don't retry automatically (could cause loops)
                logger.warning(f"Response might be incomplete: {cleaned[:50]}...")
            
            # Check if response tries to end conversation
            goodbye_phrases = ['goodbye', 'farewell', 'see you later', 'take care', 'have a great day', 'bye for now']
            if any(phrase in cleaned.lower() for phrase in goodbye_phrases) and 'always here' not in cleaned.lower():
                # Response is trying to end conversation, add keep-open message
                cleaned += " I'm always here whenever you need anything or have any questions!"
            
            return cleaned
        except Exception as e:
            self._handle_api_error(e, "General response")
            self._mark_api_failure(e)  # Track failure and disable if needed
            logger.error(f"General response error: {e}")
            return "I'm here to help with car hire and related services. How can I assist you today?"
    
    def _format_history(self, history: List[Dict]) -> str:
        """Format conversation history"""
        formatted = []
        for msg in history:
            role = "User" if msg.get('type') == 'user' else "Assistant"
            content = msg.get('content', '')[:100]
            formatted.append(f"{role}: {content}")
        return "\n".join(formatted) if formatted else "No previous conversation"
    
    def _clean_response(self, response: str) -> str:
        """Clean response to remove thinking/reasoning"""
        if not response:
            return "I'm here to help with your car hire needs. How can I assist you?"
        
        service = AgenticChatbotService()
        return service._clean_response(response)
    
    def process_message(self, session_id: str, message: str, conversation: Conversation) -> Dict[str, Any]:
        """
        Main entry point for processing user messages.
        NEVER throws exceptions - always returns a valid response dict.
        Falls back to rule-based chatbot on any error.
        """
        try:
            # Safely get user info
            try:
                user_info = {
                    'name': conversation.user_name or '',
                    'email': conversation.user_email or '',
                    'phone': conversation.user_phone or ''
                }
            except Exception:
                user_info = {}
            
            # Safely determine current form and initialize required_fields
            try:
                current_form = conversation.intent_classification if conversation.intent_classification in self.form_schemas else None
                collected_data = conversation.collected_data or {}
                required_fields = []
                
                if current_form and current_form in self.form_schemas:
                    form_required = self.form_schemas[current_form].get('required_fields', [])
                    required_fields = [f for f in form_required if f not in collected_data or not collected_data.get(f)]
            except Exception as e:
                logger.error(f"Error determining form state: {e}", exc_info=True)
                current_form = None
                collected_data = {}
                required_fields = []
            
            # Extract contact info from message if conversation doesn't have it (safely)
            try:
                if not user_info.get('name') or not user_info.get('phone') or not user_info.get('email'):
                    try:
                        conversation_history = [{
                            'type': msg.message_type,
                            'content': msg.content,
                            'timestamp': msg.timestamp
                        } for msg in conversation.messages.all()]
                    except Exception:
                        conversation_history = []
                    
                    try:
                        extracted_contact = self._extract_contact_info(message, conversation_history)
                    except Exception:
                        extracted_contact = {}
                    
                    try:
                        if extracted_contact.get('name') and not user_info.get('name'):
                            user_info['name'] = extracted_contact['name']
                            conversation.user_name = extracted_contact['name']
                        if extracted_contact.get('email') and not user_info.get('email'):
                            user_info['email'] = extracted_contact['email']
                            conversation.user_email = extracted_contact['email']
                        if extracted_contact.get('phone') and not user_info.get('phone'):
                            user_info['phone'] = extracted_contact['phone']
                            conversation.user_phone = extracted_contact['phone']
                        
                        # Save conversation if we updated it
                        if extracted_contact:
                            try:
                                conversation.save()
                            except Exception:
                                # Ignore save errors
                                pass
                    except Exception:
                        # Ignore update errors
                        pass
            except Exception as e:
                logger.error(f"Error extracting contact info: {e}", exc_info=True)
                # Continue without extracted contact info
        
            # Prepare initial state (safely)
            try:
                try:
                    messages_list = [{
                        'type': msg.message_type,
                        'content': msg.content,
                        'timestamp': msg.timestamp
                    } for msg in conversation.messages.all()]
                except Exception:
                    messages_list = []
                
                initial_state = ConversationState(
                    session_id=session_id or '',
                    user_info=user_info,
                    ip_address=getattr(conversation, 'ip_address', None),
                    messages=messages_list,
                    current_message=message or '',
                    current_form=current_form,
                    current_step=None,
                    collected_data=collected_data,
                    required_fields=required_fields,
                    completed_fields=list(collected_data.keys()) if collected_data else [],
                    intent=None,
                    confidence=0.0,
                    intent_reasoning=None,
                    is_form_active=bool(current_form),
                    form_completed=False,
                    requires_confirmation=False,
                    manual_reply_active=getattr(conversation, 'manual_reply_active', False),
                    response=None,
                    response_type='general',
                    next_node=None
                )
            except Exception as e:
                logger.error(f"Error preparing initial state: {e}", exc_info=True)
                return self._fallback_to_rule_based(message, conversation, user_info)
            
            # Try to reload API key from database if it was disabled (in case it was updated)
            try:
                if self.api_disabled:
                    logger.info("API was disabled, attempting to reload API key from database settings")
                    if self.reload_api_key():
                        logger.info("API key reloaded successfully, attempting LLM request")
                    else:
                        logger.info("API key reload failed or still invalid, using rule-based chatbot fallback")
                        return self._fallback_to_rule_based(message, conversation, user_info)
            except Exception as e:
                logger.error(f"Error reloading API key: {e}", exc_info=True)
                return self._fallback_to_rule_based(message, conversation, user_info)
            
            # Check if LLM is available, otherwise use rule-based fallback immediately
            try:
                if not self._is_client_available():
                    logger.info("LLM client not available, using rule-based chatbot fallback")
                    return self._fallback_to_rule_based(message, conversation, user_info)
            except Exception:
                # If check fails, assume unavailable
                return self._fallback_to_rule_based(message, conversation, user_info)
            
            # Run the graph
            try:
                config = {"configurable": {"thread_id": session_id}}
                final_state = self.graph.invoke(initial_state, config)
                
                # Check if API was disabled during graph execution (due to failures)
                if self.api_disabled:
                    logger.info("API disabled during execution due to failures, using rule-based chatbot fallback")
                    return self._fallback_to_rule_based(message, conversation, user_info)
                
                # Extract response (safely)
                try:
                    raw_message = final_state.get('response', "I'm processing your request...")
                    cleaned_message = self._clean_response(raw_message)
                    
                    # Check if response is an error or empty - fallback to rule-based
                    if not cleaned_message or cleaned_message.startswith("I apologize") or cleaned_message.startswith("I'm having trouble"):
                        logger.info("LLM returned error response, falling back to rule-based chatbot")
                        return self._fallback_to_rule_based(message, conversation, user_info)
                    
                    # Get updated user info from state (may have been extracted)
                    updated_user_info = final_state.get('user_info', user_info)
                    
                    result = {
                        'message': cleaned_message,
                        'response_type': final_state.get('response_type', 'general'),
                        'intent_classification': final_state.get('intent'),
                        'confidence_score': final_state.get('confidence', 0.0),
                        'collected_data': final_state.get('collected_data', {}),
                        'current_form': final_state.get('current_form'),
                        'current_step': final_state.get('current_step'),
                        'is_form_active': final_state.get('is_form_active', False),
                        'form_completed': final_state.get('form_completed', False),
                        'requires_confirmation': final_state.get('requires_confirmation', False),
                        'user_info': updated_user_info,  # Include extracted user info
                        'response_time_ms': 1000
                    }
                    
                    return result
                except Exception as e:
                    logger.error(f"Error extracting response from final state: {e}", exc_info=True)
                    return self._fallback_to_rule_based(message, conversation, user_info)
                
            except Exception as e:
                logger.error(f"LangGraph agent error: {e}, falling back to rule-based chatbot", exc_info=True)
                return self._fallback_to_rule_based(message, conversation, user_info)
        except Exception as e:
            logger.error(f"Critical error in process_message: {e}, using ultimate fallback", exc_info=True)
            return self._ultimate_fallback_response(user_info)
    
    def _fallback_to_rule_based(self, message: str, conversation: Conversation, user_info: Dict) -> Dict[str, Any]:
        """
        Fallback to rule-based chatbot when LLM is unavailable.
        NEVER throws exceptions - always returns a valid response dict.
        """
        try:
            # Get rule-based chatbot (already has exception handling)
            try:
                rule_based = get_rule_based_chatbot()
            except Exception as e:
                logger.error(f"Error getting rule-based chatbot: {e}", exc_info=True)
                # Continue with ultimate fallback
                return self._ultimate_fallback_response(user_info)
            
            # Prepare conversation history for rule-based chatbot
            try:
                conversation_history = [{
                    'type': msg.message_type,
                    'content': msg.content,
                    'timestamp': msg.timestamp
                } for msg in conversation.messages.all()]
            except Exception as e:
                logger.error(f"Error preparing conversation history: {e}", exc_info=True)
                conversation_history = []
            
            # Generate response using rule-based chatbot (already has exception handling)
            try:
                result = rule_based.generate_response(message, conversation_history)
            except Exception as e:
                logger.error(f"Error generating rule-based response: {e}", exc_info=True)
                return self._ultimate_fallback_response(user_info)
            
            # Merge with existing collected data
            try:
                collected_data = conversation.collected_data or {}
                if result.get('collected_data'):
                    collected_data.update(result.get('collected_data', {}))
            except Exception:
                collected_data = {}
            
            # Update user info if extracted (safely)
            try:
                if result.get('collected_data', {}).get('name') and not user_info.get('name'):
                    user_info['name'] = result['collected_data']['name']
                if result.get('collected_data', {}).get('email') and not user_info.get('email'):
                    user_info['email'] = result['collected_data']['email']
                if result.get('collected_data', {}).get('phone') and not user_info.get('phone'):
                    user_info['phone'] = result['collected_data']['phone']
            except Exception:
                # Ignore errors in user info update
                pass
            
            # Build response dict safely
            try:
                return {
                    'message': result.get('message', "I'm here to help with car hire and related services. How can I assist you today?"),
                    'response_type': 'general',
                    'intent_classification': result.get('intent', 'general'),
                    'confidence_score': result.get('confidence', 0.5),
                    'collected_data': collected_data,
                    'current_form': None,
                    'current_step': None,
                    'is_form_active': False,
                    'form_completed': False,
                    'requires_confirmation': False,
                    'user_info': user_info,
                    'response_time_ms': result.get('response_time_ms', 50),
                    'fallback_used': True  # Flag to indicate rule-based was used
                }
            except Exception as e:
                logger.error(f"Error building fallback response dict: {e}", exc_info=True)
                return self._ultimate_fallback_response(user_info)
        except Exception as e:
            logger.error(f"Critical error in _fallback_to_rule_based: {e}", exc_info=True)
            # Ultimate fallback
            return self._ultimate_fallback_response(user_info)
    
    def _ultimate_fallback_response(self, user_info: Dict) -> Dict[str, Any]:
        """Ultimate fallback response that never fails"""
        try:
            return {
                'message': "I'm here to help with car hire and related services. How can I assist you today?",
                'response_type': 'general',
                'intent_classification': 'general',
                'confidence_score': 0.3,
                'collected_data': {},
                'current_form': None,
                'current_step': None,
                'is_form_active': False,
                'form_completed': False,
                'requires_confirmation': False,
                'user_info': user_info if user_info else {},
                'response_time_ms': 0,
                'fallback_used': True
            }
        except Exception:
            # Even this can't fail - return minimal dict
            return {
                'message': "I'm here to help with car hire and related services. How can I assist you today?",
                'response_type': 'general',
                'intent_classification': 'general',
                'confidence_score': 0.3,
                'collected_data': {},
                'current_form': None,
                'current_step': None,
                'is_form_active': False,
                'form_completed': False,
                'requires_confirmation': False,
                'user_info': {},
                'response_time_ms': 0,
                'fallback_used': True
            }


# Singleton instance
_react_agent_instance = None

def get_react_agent():
    """Get or create the agent instance"""
    global _react_agent_instance
    if _react_agent_instance is None:
        _react_agent_instance = LangGraphChatbotAgent()
    return _react_agent_instance

def reset_react_agent():
    """Reset the singleton agent instance (forces reinitialization)"""
    global _react_agent_instance
    _react_agent_instance = None
    logger.info("React agent instance reset - will be reinitialized on next access")

class ReactAgentProxy:
    """Proxy to lazy-load the react agent"""
    def __getattr__(self, name):
        agent = get_react_agent()
        return getattr(agent, name)
    
    def __call__(self, *args, **kwargs):
        agent = get_react_agent()
        return agent(*args, **kwargs)

react_agent = ReactAgentProxy()
