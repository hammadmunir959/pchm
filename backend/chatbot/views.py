import logging
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)

from .models import Conversation, ConversationMessage, ChatbotContext, ChatbotSettings
from .services import GroqChatbotService
from .react_agent import react_agent, reset_react_agent
from .serializers import (
    ConversationSerializer, 
    ConversationMessageSerializer, 
    ChatbotContextSerializer,
    ChatbotSettingsSerializer
)
from utils.permissions import IsAdmin

class ChatbotContextViewSet(viewsets.ModelViewSet):
    """Manage chatbot context sections"""
    queryset = ChatbotContext.objects.all()
    serializer_class = ChatbotContextSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['section', 'is_active']


class ChatbotSettingsViewSet(viewsets.ModelViewSet):
    """Manage chatbot settings (singleton)"""
    queryset = ChatbotSettings.objects.all()
    serializer_class = ChatbotSettingsSerializer
    permission_classes = [IsAdmin]
    lookup_field = 'id'
    
    def get_object(self):
        """Always return the singleton instance"""
        return ChatbotSettings.get_settings()
    
    def list(self, request, *args, **kwargs):
        """Return the singleton instance as a list"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response([serializer.data])
    
    def retrieve(self, request, *args, **kwargs):
        """Return the singleton instance"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Update the singleton instance instead of creating"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Reload API key in react agent if it was updated
        self._reload_agent_if_needed(request.data)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update the singleton instance"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Reload API key in react agent if it was updated
        self._reload_agent_if_needed(request.data)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update the singleton instance"""
        return self.update(request, *args, **kwargs)
    
    def _reload_agent_if_needed(self, data):
        """Reload react agent if API key or model settings were updated"""
        # Check if API key or model-related fields were updated
        if any(key in data for key in ['api_key', 'model', 'max_tokens', 'temperature']):
            try:
                # Reset the singleton to force reinitialization with new settings on next access
                reset_react_agent()
                logger.info("React agent will be reinitialized with new settings on next chatbot request")
            except Exception as e:
                logger.error(f"Error resetting react agent after settings update: {e}")

class ConversationViewSet(viewsets.ModelViewSet):
    """Manage conversations (admin only)"""
    queryset = Conversation.objects.prefetch_related('messages').order_by('-started_at')
    serializer_class = ConversationSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'is_lead', 'manual_reply_active']

    @action(detail=True, methods=['post'])
    def toggle_manual_reply(self, request, pk=None):
        """Toggle manual reply mode on/off for a conversation"""
        conversation = self.get_object()
        if conversation.status != 'active':
            return Response({'error': 'Can only toggle manual reply for active conversations'},
                           status=status.HTTP_400_BAD_REQUEST)
        
        if conversation.manual_reply_active:
            conversation.deactivate_manual_reply()
            return Response({'message': 'Switched to Auto mode', 'manual_reply_active': False})
        else:
            conversation.activate_manual_reply()
            return Response({'message': 'Switched to Manual mode', 'manual_reply_active': True})

    # Removed mark_completed action - admins cannot manually mark as completed
    # Status is automatically managed based on session activity and completion conditions

    @action(detail=True, methods=['post'])
    def send_manual_reply(self, request, pk=None):
        """
        Send a manual reply to the user in real-time.
        Message is instantly available to the user via polling.
        """
        conversation = self.get_object()
        reply_message = request.data.get('message', '').strip()

        if not reply_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        if conversation.status != 'active':
            return Response({'error': 'Conversation is not active'},
                           status=status.HTTP_400_BAD_REQUEST)
        
        if not conversation.manual_reply_active:
            return Response({'error': 'Manual reply mode is not active'},
                           status=status.HTTP_400_BAD_REQUEST)

        # Save manual reply message as admin message (instantly available to user)
        admin_message = ConversationMessage.objects.create(
            conversation=conversation,
            message_type='admin',
            content=reply_message,
            response_time_ms=0,  # Manual replies don't have response time
            is_admin_reply=True
        )

        # Update last activity immediately
        conversation.last_activity = timezone.now()
        conversation.save()

        # Check if should auto-complete after manual reply
        conversation.check_and_mark_completed()

        # Return message details so admin can see it immediately
        serializer = ConversationMessageSerializer(admin_message)
        
        return Response({
            'message': 'Manual reply sent successfully',
            'manual_reply_active': conversation.manual_reply_active,
            'status': conversation.status,
            'sent_message': serializer.data,  # Return the sent message for immediate display
            'message_id': admin_message.id  # Return message ID for tracking
        })

@api_view(['POST'])
@permission_classes([AllowAny])  # Public endpoint for chatbot
def chatbot_message(request):
    """Handle enhanced chatbot message exchange with agentic processing"""
    try:
        data = request.data
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id', '')

        if not user_message or not session_id:
            return Response({'error': 'Message and session_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')

        # Get or create conversation with enhanced tracking
        conversation, created = Conversation.objects.get_or_create(
            session_id=session_id,
            defaults={
                'ip_address': ip_address,
                'started_at': timezone.now()
            }
        )

        # Update IP if not set and block manual replies
        if not conversation.ip_address:
            conversation.ip_address = ip_address
            conversation.save()

        # Check if conversation should be auto-completed
        conversation.check_and_mark_completed()
        
        # If completed, don't process new messages
        if conversation.status == 'completed':
            return Response({
                'message': 'This conversation has ended. Please start a new conversation.',
                'response_time_ms': 0,
                'session_id': session_id,
                'manual_reply_active': False,
                'conversation_completed': True,
                'status': conversation.status
            })

        # Save user message (instantly available to admin via polling)
        user_message_obj = ConversationMessage.objects.create(
            conversation=conversation,
            message_type='user',
            content=user_message
        )

        # Update last activity immediately
        conversation.last_activity = timezone.now()
        conversation.save()

        # Check if manual reply is active - silently block AI responses (no message returned)
        # User message is already saved and will appear to admin via polling
        if conversation.manual_reply_active:
            return Response({
                'message': '',  # Empty message - silently block AI
                'response_time_ms': 0,
                'session_id': session_id,
                'manual_reply_active': True,
                'silent_block': True,  # Flag to indicate silent blocking
                'user_message_id': user_message_obj.id,  # Return user message ID for admin tracking
                'status': conversation.status
            })

        # Generate AI response using Re-Act agent (already has comprehensive exception handling)
        try:
            ai_response = react_agent.process_message(session_id, user_message, conversation)
        except Exception as e:
            logger.error(f"Critical error in react_agent.process_message: {e}", exc_info=True)
            # Fallback to rule-based directly
            try:
                from .rule_based_chatbot import get_rule_based_chatbot
                rule_based = get_rule_based_chatbot()
                conversation_history = [{
                    'type': msg.message_type,
                    'content': msg.content,
                    'timestamp': msg.timestamp
                } for msg in conversation.messages.all()]
                fallback_result = rule_based.generate_response(user_message, conversation_history)
                ai_response = {
                    'message': fallback_result.get('message', "I'm here to help with car hire and related services. How can I assist you today?"),
                    'intent_classification': fallback_result.get('intent', 'general'),
                    'confidence_score': fallback_result.get('confidence', 0.5),
                    'collected_data': {},
                    'user_info': {},
                    'response_time_ms': 50
                }
            except Exception:
                # Ultimate fallback
                ai_response = {
                    'message': "I'm here to help with car hire and related services. How can I assist you today?",
                    'intent_classification': 'general',
                    'confidence_score': 0.3,
                    'collected_data': {},
                    'user_info': {},
                    'response_time_ms': 0
                }

        # Update conversation with analysis data from Re-Act agent (safely)
        try:
            if ai_response and ai_response.get('intent_classification'):
                conversation.intent_classification = ai_response['intent_classification']
                conversation.confidence_score = ai_response.get('confidence_score', 0.0)

            if ai_response and ai_response.get('collected_data'):
                try:
                    conversation.collected_data.update(ai_response['collected_data'])
                except Exception:
                    # Ignore update errors
                    pass

            # Update user information from collected data or extracted contact info (safely)
            try:
                extracted_data = ai_response.get('collected_data', {}) if ai_response else {}
                extracted_user_info = ai_response.get('user_info', {}) if ai_response else {}
                
                # Update from extracted user info (pre-extraction from messages)
                if extracted_user_info.get('name') and not conversation.user_name:
                    conversation.user_name = extracted_user_info['name']
                if extracted_user_info.get('email') and not conversation.user_email:
                    conversation.user_email = extracted_user_info['email']
                if extracted_user_info.get('phone') and not conversation.user_phone:
                    conversation.user_phone = extracted_user_info['phone']
                
                # Update from collected form data (only if not already set)
                if extracted_data.get('name') or extracted_data.get('full_name'):
                    if not conversation.user_name:
                        conversation.user_name = extracted_data.get('name') or extracted_data.get('full_name')
                if extracted_data.get('email'):
                    if not conversation.user_email:
                        conversation.user_email = extracted_data['email']
                if extracted_data.get('phone'):
                    if not conversation.user_phone:
                        conversation.user_phone = extracted_data['phone']
                
                # Check for lead generation
                if ai_response.get('is_lead', False) or extracted_data or extracted_user_info:
                    conversation.is_lead = True
            except Exception as e:
                logger.error(f"Error updating conversation data: {e}", exc_info=True)
                # Continue without updating

            try:
                conversation.last_activity = timezone.now()
                conversation.save()
            except Exception:
                # Ignore save errors
                pass

            # Save AI response (safely)
            try:
                response_message = ai_response.get('message', "I'm here to help with car hire and related services. How can I assist you today?") if ai_response else "I'm here to help with car hire and related services. How can I assist you today?"
                ConversationMessage.objects.create(
                    conversation=conversation,
                    message_type='assistant',
                    content=response_message,
                    response_time_ms=ai_response.get('response_time_ms', 1000) if ai_response else 1000,
                    is_admin_reply=False
                )
            except Exception as e:
                logger.error(f"Error saving AI response message: {e}", exc_info=True)
                # Continue without saving message

            # Check again if should auto-complete after AI response
            try:
                conversation.check_and_mark_completed()
            except Exception:
                # Ignore completion check errors
                pass

            # Return response (safely) with message ID for real-time tracking
            try:
                # Get the latest assistant message ID if it was saved
                latest_assistant_msg = conversation.messages.filter(message_type='assistant').order_by('-id').first()
                latest_message_id = latest_assistant_msg.id if latest_assistant_msg else None
            except Exception:
                latest_message_id = None
            
            return Response({
                'message': ai_response.get('message', "I'm here to help with car hire and related services. How can I assist you today?") if ai_response else "I'm here to help with car hire and related services. How can I assist you today?",
                'response_time_ms': ai_response.get('response_time_ms', 1000) if ai_response else 1000,
                'session_id': session_id,
                'manual_reply_active': getattr(conversation, 'manual_reply_active', False),
                'intent_classified': bool(ai_response.get('intent_classification')) if ai_response else False,
                'current_form': ai_response.get('current_form') if ai_response else None,
                'current_step': ai_response.get('current_step') if ai_response else None,
                'is_form_active': ai_response.get('is_form_active', False) if ai_response else False,
                'form_completed': ai_response.get('form_completed', False) if ai_response else False,
                'requires_confirmation': ai_response.get('requires_confirmation', False) if ai_response else False,
                'status': getattr(conversation, 'status', 'active'),
                'message_id': latest_message_id,  # Return message ID for real-time tracking
                'user_message_id': user_message_obj.id if 'user_message_obj' in locals() else None  # Return user message ID
            })
        except Exception as e:
            logger.error(f"Error processing ai_response: {e}", exc_info=True)
            # Return safe fallback response
            try:
                user_msg_id = user_message_obj.id if 'user_message_obj' in locals() else None
            except Exception:
                user_msg_id = None
            return Response({
                'message': "I'm here to help with car hire and related services. How can I assist you today?",
                'response_time_ms': 0,
                'session_id': session_id,
                'manual_reply_active': False,
                'intent_classified': False,
                'current_form': None,
                'current_step': None,
                'is_form_active': False,
                'form_completed': False,
                'requires_confirmation': False,
                'status': 'active',
                'user_message_id': user_msg_id
            })
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Chatbot error: {str(e)}", exc_info=True)
        return Response({
            'error': 'An error occurred processing your message. Please try again.',
            'message': "I apologize, but I'm having trouble processing your request right now. Please try again or contact us directly at info@prestigecarhire.co.uk.",
            'response_time_ms': 0,
            'session_id': session_id or '',
            'manual_reply_active': False,
            'status': 'active'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])  # Public endpoint for widget polling
def get_conversation_messages(request):
    """
    Get conversation messages by session_id (for widget polling).
    Optimized for real-time chat in manual mode.
    Returns only new messages since last_message_id for efficient polling.
    """
    session_id = request.query_params.get('session_id')
    last_message_id = request.query_params.get('last_message_id')  # Optional filter for new messages only
    
    if not session_id:
        return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        conversation = Conversation.objects.prefetch_related('messages').get(session_id=session_id)
        messages = conversation.messages.all().order_by('id')  # Ensure ordered by ID (chronological)
        
        # Get the latest message ID before filtering (for tracking)
        latest_message_id = messages.last().id if messages.exists() else 0
        
        # Filter messages after last_message_id if provided (only return new messages)
        if last_message_id:
            try:
                last_id = int(last_message_id)
                messages = messages.filter(id__gt=last_id)
            except (ValueError, TypeError):
                pass  # Ignore invalid last_message_id
        
        serializer = ConversationMessageSerializer(messages, many=True)
        
        # Return response with metadata for real-time tracking
        return Response({
            'messages': serializer.data,
            'manual_reply_active': conversation.manual_reply_active,
            'status': conversation.status,
            'latest_message_id': latest_message_id,  # Latest message ID in conversation
            'has_new_messages': len(serializer.data) > 0,  # Flag indicating if there are new messages
            'last_activity': conversation.last_activity.isoformat() if conversation.last_activity else None
        })
    except Conversation.DoesNotExist:
        # Return empty response instead of 404 for polling endpoints
        # This prevents 404 warnings when polling for conversations that don't exist yet
        return Response({
            'messages': [],
            'manual_reply_active': False,
            'status': 'active',
            'latest_message_id': 0,
            'has_new_messages': False,
            'last_activity': None
        }, status=status.HTTP_200_OK)
