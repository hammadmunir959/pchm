from rest_framework import serializers
from .models import Conversation, ConversationMessage, ChatbotContext, ChatbotSettings

class ConversationMessageSerializer(serializers.ModelSerializer):
    """Serializer for conversation messages with real-time support"""
    class Meta:
        model = ConversationMessage
        fields = ['id', 'message_type', 'content', 'response_time_ms', 'timestamp', 'is_admin_reply']
    
    def to_representation(self, instance):
        """Add formatted timestamp for real-time display"""
        data = super().to_representation(instance)
        # Ensure timestamp is in ISO format for frontend
        if instance.timestamp:
            data['timestamp'] = instance.timestamp.isoformat()
        return data

class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations"""
    messages = ConversationMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'session_id', 'user_email', 'user_name', 'user_phone', 
            'ip_address', 'is_lead', 'status', 'manual_reply_active',
            'collected_data', 'intent_classification', 'confidence_score',
            'started_at', 'ended_at', 'last_activity', 'messages', 'message_count'
        ]

    def get_message_count(self, obj):
        return obj.messages.count()

class ChatbotContextSerializer(serializers.ModelSerializer):
    """Serializer for chatbot context sections"""
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatbotContext
        fields = [
            'id', 'section', 'title', 'content', 'keywords', 'is_active',
            'display_order', 'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ChatbotSettingsSerializer(serializers.ModelSerializer):
    """Serializer for chatbot settings"""
    updated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatbotSettings
        fields = [
            'id', 'api_key', 'model', 'max_tokens', 'temperature',
            'is_active', 'auto_populate_context', 'updated_at', 'updated_by', 'updated_by_name'
        ]
        read_only_fields = ['id', 'updated_at']
    
    def get_updated_by_name(self, obj):
        return obj.updated_by.get_full_name() if obj.updated_by else None
    
    def update(self, instance, validated_data):
        """Update settings and track who updated them"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)
