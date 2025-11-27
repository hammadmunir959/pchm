from django.contrib import admin
from .models import ChatbotContext, Conversation, ConversationMessage, ChatbotSettings

@admin.register(ChatbotContext)
class ChatbotContextAdmin(admin.ModelAdmin):
    list_display = ['section', 'title', 'is_active', 'display_order', 'updated_at']
    list_filter = ['section', 'is_active']
    search_fields = ['title', 'content', 'keywords']
    ordering = ['display_order', 'section']
    fieldsets = (
        ('Basic Information', {
            'fields': ('section', 'title', 'is_active', 'display_order')
        }),
        ('Content', {
            'fields': ('content', 'keywords'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user_name', 'user_email', 'status', 'started_at', 'ip_address']
    list_filter = ['status', 'is_lead', 'started_at']
    search_fields = ['session_id', 'user_name', 'user_email', 'ip_address']
    readonly_fields = ['session_id', 'started_at', 'last_activity']
    fieldsets = (
        ('Session Info', {
            'fields': ('session_id', 'status', 'manual_reply_active', 'started_at', 'last_activity')
        }),
        ('User Information', {
            'fields': ('user_name', 'user_email', 'user_phone', 'ip_address')
        }),
        ('Analysis', {
            'fields': ('intent_classification', 'confidence_score', 'collected_data'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_lead', 'ended_at')
        }),
    )

@admin.register(ConversationMessage)
class ConversationMessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'message_type', 'timestamp', 'response_time_ms']
    list_filter = ['message_type', 'timestamp']
    search_fields = ['content']
    readonly_fields = ['timestamp']
    raw_id_fields = ['conversation']

@admin.register(ChatbotSettings)
class ChatbotSettingsAdmin(admin.ModelAdmin):
    """Admin interface for chatbot settings (singleton)"""
    
    def has_add_permission(self, request):
        """Only allow one instance"""
        return not ChatbotSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of settings"""
        return False
    
    list_display = ['id', 'model', 'is_active', 'updated_at', 'updated_by']
    fieldsets = (
        ('API Configuration', {
            'fields': ('api_key', 'model')
        }),
        ('Response Settings', {
            'fields': ('max_tokens', 'temperature')
        }),
        ('Feature Flags', {
            'fields': ('is_active', 'auto_populate_context')
        }),
        ('Metadata', {
            'fields': ('updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['id', 'updated_at']
    
    def get_object(self, request, object_id=None, from_db=None):
        """Get or create the singleton instance"""
        return ChatbotSettings.get_settings()
