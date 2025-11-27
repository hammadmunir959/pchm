"""
Enhanced Chatbot Service with Agentic AI capabilities
Implements Re-Act (Reasoning + Acting) architecture for intelligent conversations
"""

import json
import re
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

import groq
from django.conf import settings
from django.utils import timezone

from .models import ChatbotContext, Conversation
from .rule_based_chatbot import get_rule_based_chatbot

logger = logging.getLogger(__name__)


class AgenticChatbotService:
    """
    Agentic Chatbot with Re-Act architecture for intelligent conversations.
    Implements goal-driven reasoning, context awareness, and data extraction.
    """

    def __init__(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            logger.warning("No Groq API key found in settings")
            self.client = None
        else:
            try:
                self.client = groq.Groq(api_key=api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self.client = None
        self.model = getattr(settings, 'GROQ_MODEL', 'llama-3.1-8b-instant')

        # Load context sections
        self.context_sections = self._load_context_sections()

        # Define intent patterns and keywords
        self.intent_patterns = {
            'greeting': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
            'company_info': ['company', 'about', 'who are you', 'what do you do', 'services'],
            'pricing': ['price', 'cost', 'fee', 'rate', 'expensive', 'cheap', 'budget'],
            'contact': ['contact', 'phone', 'email', 'address', 'location', 'call'],
            'booking': ['book', 'reserve', 'appointment', 'schedule', 'rent', 'hire'],
            'emergency': ['emergency', 'accident', 'breakdown', 'urgent', 'help', 'stuck'],
            'faq': ['faq', 'question', 'how', 'what', 'when', 'where', 'why'],
            'goodbye': ['bye', 'goodbye', 'thank you', 'thanks', 'see you', 'later']
        }

    def _load_context_sections(self) -> Dict[str, Dict]:
        """Load and cache chatbot context sections for efficient access."""
        sections = {}
        for context in ChatbotContext.objects.filter(is_active=True):
            sections[context.section] = {
                'title': context.title,
                'content': context.content,
                'keywords': context.get_keywords_list(),
                'display_order': context.display_order
            }
        return sections

    def classify_intent(self, message: str, conversation: Conversation = None) -> Tuple[str, float]:
        """
        Classify user intent using keyword matching and context analysis.
        Returns (intent, confidence_score)
        """
        message_lower = message.lower()
        scores = {}

        # Keyword-based classification
        for intent, keywords in self.intent_patterns.items():
            score = 0
            for keyword in keywords:
                if keyword in message_lower:
                    score += 1
            if score > 0:
                # Normalize score based on message length
                scores[intent] = min(score / len(message.split()), 1.0)

        # Context-based classification using loaded sections
        for section_key, section_data in self.context_sections.items():
            context_score = 0
            for keyword in section_data['keywords']:
                if keyword in message_lower:
                    context_score += 2  # Higher weight for context keywords
            if context_score > 0:
                scores[section_key] = min(context_score / len(message.split()), 1.0)

        # Return highest scoring intent
        if scores:
            best_intent = max(scores, key=scores.get)
            return best_intent, scores[best_intent]

        return 'general', 0.0

    def extract_data(self, message: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Extract structured data from user messages using LLM analysis.
        Returns dictionary with extracted information.
        """
        if not conversation_history:
            conversation_history = []

        # Prepare conversation context for LLM
        context_messages = []
        for msg in conversation_history[-5:]:  # Last 5 messages for context
            context_messages.append(f"{'User' if msg['type'] == 'user' else 'Assistant'}: {msg['content']}")

        context = "\n".join(context_messages) if context_messages else "New conversation"

        prompt = f"""
        Analyze the following user message and conversation context to extract any relevant information.
        Focus on extracting: name, email, phone number, location, intent, preferences, and any other structured data.
        
        IMPORTANT: For booking-related conversations, also extract:
        - Dates: pickup_date, dropoff_date, start_date, end_date, or any date references (e.g., "tomorrow", "next week")
        - Vehicle information: vehicle_type, car_type, vehicle (e.g., "SUV", "sedan", "sports car")
        - Location: pickup_location, dropoff_location, address, location, city

        Conversation Context:
        {context}

        Current User Message:
        {message}

        Return a JSON object with extracted data. Only include fields that are actually mentioned or clearly implied.
        Use null for missing values. Be conservative - don't make assumptions.
        
        For dates, if relative terms are used (like "tomorrow", "next week"), include them as-is in the date field.

        Example format:
        {{
            "name": "John Smith",
            "email": "john@example.com",
            "phone": "+44 123 456 7890",
            "location": "London",
            "pickup_location": "London Airport",
            "pickup_date": "tomorrow",
            "vehicle_type": "SUV",
            "intent": "booking inquiry",
            "urgency_level": "high",
            "preferred_contact_method": "phone"
        }}
        """

        if not self.client:
            logger.error("Groq client not available for data extraction")
            return {}

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a data extraction specialist. Return ONLY valid JSON. Do not include any thinking, reasoning, or explanation - just the JSON object."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.1  # Low temperature for consistent extraction
            )
            
            # Check if response has content
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from Groq API for data extraction")
                return {}
            
            extracted_text = response.choices[0].message.content.strip()

            # Clean and parse JSON - remove thinking/reasoning
            # Remove markdown code blocks
            if extracted_text.startswith('```json'):
                extracted_text = extracted_text[7:]
            elif extracted_text.startswith('```'):
                extracted_text = extracted_text[3:]
            if extracted_text.endswith('```'):
                extracted_text = extracted_text[:-3]
            
            # Remove any thinking/reasoning text before JSON
            json_start = extracted_text.find('{')
            if json_start > 0:
                extracted_text = extracted_text[json_start:]
            
            # Remove any text after JSON
            json_end = extracted_text.rfind('}')
            if json_end > 0 and json_end < len(extracted_text) - 1:
                extracted_text = extracted_text[:json_end + 1]

            try:
                return json.loads(extracted_text.strip())
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse extracted data JSON: {extracted_text}")
                return {}
        except Exception as e:
            error_msg = str(e)
            if '401' in error_msg or 'invalid_api_key' in error_msg.lower() or 'unauthorized' in error_msg.lower():
                logger.error(f"Data extraction error: Invalid or expired API key. Please check your GROQ_API_KEY setting.")
            else:
                logger.error(f"Data extraction error: {e}")
            return {}

    def get_relevant_context(self, intent: str, message: str) -> str:
        """
        Retrieve relevant context based on classified intent and user message.
        """
        # Get context for specific intent
        if intent in self.context_sections:
            context_data = self.context_sections[intent]
            return f"{context_data['title']}\n\n{context_data['content']}"

        # Fallback to general context
        if 'intro' in self.context_sections:
            return self.context_sections['intro']['content']

        return "I'm here to help you with car hire and related services. How can I assist you today?"

    def generate_agentic_response(self, message: str, conversation: Conversation) -> Dict[str, Any]:
        """
        Generate response using Re-Act architecture:
        1. Reason about user intent and context
        2. Act by gathering relevant information
        3. Generate appropriate response
        4. Update conversation state
        
        Falls back to rule-based chatbot if LLM is unavailable.
        """
        start_time = timezone.now()

        # Check if LLM is available, otherwise use rule-based fallback
        if not self.client:
            logger.info("LLM client not available, using rule-based chatbot fallback")
            return self._fallback_to_rule_based(message, conversation)

        # Step 1: Classify intent
        intent, confidence = self.classify_intent(message, conversation)

        # Step 2: Extract data from message
        conversation_history = [
            {'type': msg.message_type, 'content': msg.content, 'timestamp': msg.timestamp}
            for msg in conversation.messages.all()
        ]
        extracted_data = self.extract_data(message, conversation_history)

        # Step 3: Get relevant context
        context = self.get_relevant_context(intent, message)

        # Step 4: Generate intelligent response using LLM
        try:
            response = self._generate_response_with_context(message, context, intent, conversation)
            
            # Check if response indicates an error - fallback to rule-based
            if not response or response.startswith("I apologize") or response.startswith("I'm having trouble"):
                logger.info("LLM returned error response, falling back to rule-based chatbot")
                return self._fallback_to_rule_based(message, conversation)
        except Exception as e:
            logger.error(f"Error generating LLM response: {e}, falling back to rule-based")
            return self._fallback_to_rule_based(message, conversation)

        # Step 5: Analyze for lead generation
        is_lead = self._analyze_lead_potential(message, extracted_data, intent)

        # Calculate response time
        response_time = (timezone.now() - start_time).total_seconds() * 1000

        return {
            'message': response,
            'response_time_ms': int(response_time),
            'intent_classification': intent,
            'confidence_score': confidence,
            'collected_data': extracted_data,
            'is_lead': is_lead,
            'context_used': intent if intent in self.context_sections else 'general'
        }
    
    def _fallback_to_rule_based(self, message: str, conversation: Conversation) -> Dict[str, Any]:
        """Fallback to rule-based chatbot when LLM is unavailable"""
        try:
            rule_based = get_rule_based_chatbot()
            
            # Prepare conversation history
            conversation_history = [
                {'type': msg.message_type, 'content': msg.content, 'timestamp': msg.timestamp}
                for msg in conversation.messages.all()
            ]
            
            # Generate response using rule-based chatbot
            result = rule_based.generate_response(message, conversation_history)
            
            return {
                'message': result['message'],
                'response_time_ms': result.get('response_time_ms', 50),
                'intent_classification': result.get('intent', 'general'),
                'confidence_score': result.get('confidence', 0.5),
                'collected_data': result.get('collected_data', {}),
                'is_lead': result.get('is_lead', False),
                'context_used': 'rule_based',
                'fallback_used': True
            }
        except Exception as e:
            logger.error(f"Rule-based chatbot fallback error: {e}", exc_info=True)
            return {
                'message': "I'm here to help with car hire and related services. How can I assist you today?",
                'response_time_ms': 50,
                'intent_classification': 'general',
                'confidence_score': 0.3,
                'collected_data': {},
                'is_lead': False,
                'context_used': 'fallback',
                'fallback_used': True
            }

    def _generate_response_with_context(self, message: str, context: str, intent: str, conversation: Conversation) -> str:
        """
        Generate context-aware response using LLM with conversation history.
        """
        # Get recent conversation history
        recent_messages = conversation.messages.order_by('-timestamp')[:6]  # Last 3 exchanges
        history = []
        for msg in reversed(recent_messages):
            history.append(f"{'User' if msg.message_type == 'user' else 'Assistant'}: {msg.content}")

        conversation_context = "\n".join(history) if history else "New conversation"

        prompt = f"""
        You are an intelligent customer service chatbot for Prestige Car Hire Management.

        CONVERSATION HISTORY:
        {conversation_context}

        RELEVANT CONTEXT:
        {context}

        USER MESSAGE: {message}

        CLASSIFIED INTENT: {intent}

        Instructions:
        1. Be professional, helpful, and friendly
        2. Use the provided context to give accurate information
        3. If the user is asking about services you don't have context for, politely redirect to available services
        4. If this seems like a lead or potential customer, be engaging and offer to help further
        5. Keep responses concise but informative
        6. If appropriate, suggest next steps or ask clarifying questions
        7. Maintain conversation flow naturally
        8. IMPORTANT: If the user says goodbye, thanks, or tries to end the conversation, respond warmly that you're always here and available whenever they need anything or have any questions. Always keep the conversation open and welcoming.
        9. CRITICAL: Respond with ONLY your final answer. Do NOT include any thinking, reasoning, parsing, observation, or internal process. Do NOT use tags like <thinking>, <reasoning>, <think>, or show any reasoning steps. Just provide a direct, helpful response immediately.

        Generate a helpful, professional response (direct answer only, no thinking or reasoning):
        """

        if not self.client:
            logger.error("Groq client not available for response generation")
            return "I'm here to help with your car hire needs. How can I assist you?"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional customer service chatbot. Be helpful, accurate, and engaging. IMPORTANT: Never end conversations - always keep them open. If users say goodbye or thanks, respond warmly that you're always here and available whenever they need anything or have any questions. CRITICAL: Respond with ONLY your final answer. Never include thinking, reasoning, parsing, observation, or any internal process. Never use tags like <thinking>, <reasoning>, <think>, or show reasoning steps. Just provide direct, helpful responses."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            # Check if response has content
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from Groq API for response generation")
                return "I'm here to help with your car hire needs. How can I assist you?"
            
            raw_response = response.choices[0].message.content.strip()
            
            # Clean response: Remove any thinking/reasoning markers
            cleaned_response = self._clean_response(raw_response)
            
            return cleaned_response
        except Exception as e:
            error_msg = str(e)
            if '401' in error_msg or 'invalid_api_key' in error_msg.lower() or 'unauthorized' in error_msg.lower():
                logger.error(f"Response generation error: Invalid or expired API key. Please check your GROQ_API_KEY setting.")
            else:
                logger.error(f"Response generation error: {e}")
            return "I apologize, but I'm having trouble processing your request right now. Please try again or contact us directly at info@prestigecarhire.co.uk."

    def _clean_response(self, response: str) -> str:
        """
        Clean response to remove any thinking, reasoning, or parsing steps.
        """
        if not response:
            return "I'm here to help with your car hire needs. How can I assist you?"
        
        # Remove common thinking markers and tags (case-insensitive, multiline)
        # First, remove all tag pairs and their content (most aggressive)
        thinking_patterns = [
            # XML/HTML style tags (must come first to catch all variants)
            # Order matters - most specific patterns first
            r'<redacted_reasoning[^>]*>.*?</redacted_reasoning[^>]*>',
            r'<redacted[^>]*>.*?</redacted[^>]*>',
            r'<think[^>]*>.*?</think[^>]*>',
            r'<thinking[^>]*>.*?</thinking[^>]*>',
            r'<reasoning[^>]*>.*?</reasoning[^>]*>',
            r'<parse[^>]*>.*?</parse[^>]*>',
            r'<observation[^>]*>.*?</observation[^>]*>',
            r'<thought[^>]*>.*?</thought[^>]*>',
            r'<action[^>]*>.*?</action[^>]*>',
            # Self-closing tags
            r'<redacted_reasoning[^>]*/>',
            r'<redacted[^>]*/>',
            # Bracket style tags
            r'\[think[^\]]*\].*?\[/think[^\]]*\]',
            r'\[thinking[^\]]*\].*?\[/thinking[^\]]*\]',
            r'\[reasoning[^\]]*\].*?\[/reasoning[^\]]*\]',
            r'\[redacted[^\]]*\].*?\[/redacted[^\]]*\]',
            r'\[redacted_reasoning[^\]]*\].*?\[/redacted_reasoning[^\]]*\]',
            r'\[parse[^\]]*\].*?\[/parse[^\]]*\]',
            # Lines starting with thinking indicators
            r'^.*?thinking.*?:.*?\n',
            r'^.*?reasoning.*?:.*?\n',
            r'^.*?parsing.*?:.*?\n',
            r'^.*?observe.*?:.*?\n',
            r'^.*?thought.*?:.*?\n',
            r'^.*?action.*?:.*?\n',
            r'^.*?let me.*?:.*?\n',
            r'^.*?i need to.*?:.*?\n',
            r'^.*?first.*?:.*?\n',
            r'^.*?step.*?:.*?\n',
        ]
        
        cleaned = response
        
        # First, remove all thinking/reasoning tags using pattern matching
        for pattern in thinking_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE | re.DOTALL | re.MULTILINE)
        
        # More aggressive: Remove ANY tag that contains thinking-related keywords
        # This catches variants like <think>, <think>, <think_reasoning>, etc.
        thinking_tag_pattern = r'<[^>]*(?:think|reasoning|redacted|parse|observe|thought|action)[^>]*>.*?</[^>]*(?:think|reasoning|redacted|parse|observe|thought|action)[^>]*>'
        cleaned = re.sub(thinking_tag_pattern, '', cleaned, flags=re.IGNORECASE | re.DOTALL | re.MULTILINE)
        
        # Remove standalone thinking-related opening/closing tags
        thinking_standalone_tags = [
            r'<[^>]*(?:think|reasoning|redacted|parse|observe|thought|action)[^>]*>',
            r'</[^>]*(?:think|reasoning|redacted|parse|observe|thought|action)[^>]*>',
        ]
        for pattern in thinking_standalone_tags:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Remove lines that contain thinking indicators anywhere
        lines = cleaned.split('\n')
        filtered_lines = []
        
        for line in lines:
            line_lower = line.strip().lower()
            # Skip lines that contain thinking/reasoning markers
            if any(marker in line_lower for marker in [
                'thinking:', 'reasoning:', 'parsing:', 'observe:', 
                'thought:', 'action:', 'let me think', 'i need to',
                'first,', 'step 1', 'step 2', 'step 3', 'step 4',
                '<thinking>', '<reasoning>', '<redacted', '<think>',
                '[thinking]', '[reasoning]', '[redacted', '[think]',
                'make sure to', 'keep the tone', 'check if the response',
                'within the character limit', 'let me put it all together',
                'avoid using long sentences', 'invite them to ask'
            ]):
                continue
            # Skip empty lines
            if not line.strip():
                continue
            filtered_lines.append(line)
        
        cleaned = '\n'.join(filtered_lines).strip()
        
        # Remove any remaining tag-like content (more aggressive)
        # Remove all HTML/XML style tags and their content (catch-all for any tag)
        cleaned = re.sub(r'<[^>]*>.*?</[^>]*>', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
        cleaned = re.sub(r'<[^>]+>', '', cleaned)  # Remove any remaining opening/closing tags
        # Remove all bracket style tags and their content
        cleaned = re.sub(r'\[[^\]]*\].*?\[/[^\]]*\]', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
        cleaned = re.sub(r'\[[^\]]+\]', '', cleaned)  # Remove any remaining bracket tags
        # Remove any standalone "redacted" mentions
        cleaned = re.sub(r'\bredacted\b', '', cleaned, flags=re.IGNORECASE)
        # Remove any lines that are just whitespace or contain only special characters
        lines = cleaned.split('\n')
        cleaned = '\n'.join([line for line in lines if line.strip() and not re.match(r'^[^\w\s]*$', line.strip())])
        cleaned = cleaned.strip()
        
        # Final cleanup: Remove common thinking phrases that might have leaked through
        thinking_phrases = [
            r'\bthat\b\s*$',  # Standalone "That" at end of line
            r'^that\b',  # "That" at start
            r'okay,?\s+the\s+user',  # "Okay, the user..."
            r'let me\s+\w+',  # "Let me think/check/etc"
            r'first,\s+',  # "First, "
            r'make sure\s+to',  # "Make sure to..."
            r'check if\s+the',  # "Check if the..."
        ]
        for phrase in thinking_phrases:
            cleaned = re.sub(phrase, '', cleaned, flags=re.IGNORECASE | re.MULTILINE)
        
        # Clean up extra whitespace
        cleaned = re.sub(r'\n\s*\n\s*\n+', '\n\n', cleaned)  # Multiple blank lines to double
        cleaned = cleaned.strip()
        
        # If response was completely removed or too short, return a default
        if not cleaned or len(cleaned) < 10:
            return "I'm here to help with your car hire needs. How can I assist you?"
        
        return cleaned

    def _analyze_lead_potential(self, message: str, extracted_data: Dict, intent: str) -> bool:
        """
        Analyze if the conversation shows lead potential.
        """
        lead_indicators = [
            'book' in message.lower(),
            'hire' in message.lower(),
            'rent' in message.lower(),
            'price' in message.lower(),
            'cost' in message.lower(),
            'contact' in extracted_data,
            'phone' in extracted_data,
            'email' in extracted_data,
            intent in ['booking', 'pricing', 'contact']
        ]

        return any(lead_indicators)

    def detect_lead_intent(self, message: str) -> bool:
        """Legacy method for backward compatibility."""
        intent, _ = self.classify_intent(message)
        return intent in ['booking', 'contact', 'pricing']

    def extract_contact_info(self, message: str) -> Dict[str, str]:
        """Legacy method for backward compatibility."""
        extracted = self.extract_data(message)
        return {
            'email': extracted.get('email'),
            'phone': extracted.get('phone'),
            'name': extracted.get('name')
        }

    def generate_response(self, message: str) -> Dict[str, Any]:
        """Legacy method for basic responses without agentic processing."""
        context = self.get_relevant_context('intro', message)

        if not self.client:
            logger.error("Groq client not available for basic response generation")
            return {
                'message': "I'm here to help with your car hire needs. How can I assist you?",
                'response_time_ms': 500
            }

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": f"Context: {context}"},
                    {"role": "user", "content": message}
                ],
                max_tokens=200
            )
            
            # Check if response has content
            if not response.choices or not response.choices[0].message.content:
                logger.error("Empty response from Groq API for basic response generation")
                return {
                    'message': "I'm here to help with your car hire needs. How can I assist you?",
                    'response_time_ms': 1000
                }
            
            return {
                'message': response.choices[0].message.content.strip(),
                'response_time_ms': 1000  # Approximate
            }
        except Exception as e:
            error_msg = str(e)
            if '401' in error_msg or 'invalid_api_key' in error_msg.lower() or 'unauthorized' in error_msg.lower():
                logger.error(f"Basic response generation error: Invalid or expired API key. Please check your GROQ_API_KEY setting.")
            else:
                logger.error(f"Basic response generation error: {e}")
            return {
                'message': "I'm here to help with your car hire needs. How can I assist you?",
                'response_time_ms': 500
            }


# Backward compatibility
GroqChatbotService = AgenticChatbotService