from django.db import models
from django.core.exceptions import ValidationError
import uuid

class ChatbotContext(models.Model):
    """Context sections for chatbot to classify intents and generate responses"""

    SECTION_CHOICES = [
        ('intro', 'Chatbot Introduction'),
        ('company', 'Company Information'),
        ('services', 'Services Overview'),
        ('working', 'How We Work'),
        ('faqs', 'Frequently Asked Questions'),
        ('pricing', 'Pricing Information'),
        ('contact', 'Contact Details'),
        ('policies', 'Company Policies'),
        ('emergency', 'Emergency Services'),
    ]

    section = models.CharField(max_length=20, choices=SECTION_CHOICES, unique=True)
    title = models.CharField(max_length=200)
    content = models.TextField(help_text="Detailed context content for this section")
    keywords = models.TextField(
        blank=True,
        help_text="Comma-separated keywords for intent classification"
    )
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['display_order', 'section']
        verbose_name = 'Chatbot Context'
        verbose_name_plural = 'Chatbot Contexts'

    def __str__(self):
        return f"{self.get_section_display()} - {self.title}"

    def get_keywords_list(self):
        """Return keywords as a list"""
        if not self.keywords:
            return []
        return [k.strip().lower() for k in self.keywords.split(',') if k.strip()]


class Conversation(models.Model):
    """Enhanced chatbot conversation session"""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('manual', 'Manual Reply Active'),
    ]

    session_id = models.CharField(max_length=200, unique=True, default=uuid.uuid4)
    user_email = models.EmailField(null=True, blank=True)
    user_name = models.CharField(max_length=200, blank=True)
    user_phone = models.CharField(max_length=20, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    is_lead = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    manual_reply_active = models.BooleanField(default=False)
    collected_data = models.JSONField(default=dict, help_text="Extracted data from conversation")
    intent_classification = models.CharField(max_length=100, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['status', '-started_at']),
            models.Index(fields=['session_id']),
            models.Index(fields=['ip_address']),
        ]

    def __str__(self):
        return f"Conversation {self.id} - {self.session_id} ({self.get_status_display()})"

    @property
    def duration(self):
        """Calculate conversation duration in minutes"""
        if not self.ended_at:
            return None
        return (self.ended_at - self.started_at).total_seconds() / 60

    def mark_completed(self):
        """Mark conversation as completed (only called automatically)"""
        from django.utils import timezone
        if self.status != 'completed':
            self.status = 'completed'
            self.ended_at = timezone.now()
            self.manual_reply_active = False  # Deactivate manual mode when completed
            self.save()

    def activate_manual_reply(self):
        """Activate manual reply mode (only for active conversations)"""
        if self.status == 'active':
            self.manual_reply_active = True
            self.save()

    def deactivate_manual_reply(self):
        """Deactivate manual reply mode"""
        if self.status == 'active':
            self.manual_reply_active = False
            self.save()

    def check_and_mark_completed(self):
        """
        Check if conversation should be auto-completed.
        Conversations NEVER auto-complete - always keep chatting with users.
        """
        # Already completed
        if self.status == 'completed':
            return False
        
        # Never auto-complete - always keep the conversation active
        # Even if user says goodbye, keep the conversation open and respond that you're always available
        return False

class ConversationMessage(models.Model):
    """Individual messages in a conversation"""
    MESSAGE_TYPES = [
        ('user', 'User Message'),
        ('assistant', 'Assistant Message (AI)'),
        ('admin', 'Admin Message (Manual)'),
    ]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='user')
    content = models.TextField()
    response_time_ms = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_admin_reply = models.BooleanField(default=False, help_text="True if this is a manual admin reply")

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.get_message_type_display()} - {self.content[:50]}"


class ChatbotSettings(models.Model):
    """Chatbot configuration settings - singleton model"""
    
    MODEL_CHOICES = [
        # Production Models
        ('llama-3.1-8b-instant', 'Llama 3.1 8B Instant (560 tps, 131K context)'),
        ('llama-3.3-70b-versatile', 'Llama 3.3 70B Versatile (280 tps, 131K context)'),
        ('openai/gpt-oss-120b', 'OpenAI GPT-OSS 120B (500 tps, 131K context)'),
        ('openai/gpt-oss-20b', 'OpenAI GPT-OSS 20B (1000 tps, 131K context)'),
        
        # Production Systems
        ('groq/compound', 'Groq Compound (450 tps, 131K context) - Agentic AI System'),
        ('groq/compound-mini', 'Groq Compound Mini (450 tps, 131K context)'),
        
        # Preview Models
        ('meta-llama/llama-4-maverick-17b-128e-instruct', 'Llama 4 Maverick 17B 128E (600 tps, 131K context)'),
        ('meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 Scout 17B 16E (750 tps, 131K context)'),
        ('moonshotai/kimi-k2-instruct-0905', 'Moonshot AI Kimi K2 (200 tps, 262K context)'),
        ('qwen/qwen3-32b', 'Qwen3 32B (400 tps, 131K context)'),
        
        # Legacy/Deprecated (keeping for backward compatibility)
        ('mixtral-8x7b-32768', 'Mixtral 8x7B (32K context) - Legacy'),
        ('llama-3.1-70b-versatile', 'Llama 3.1 70B Versatile - Legacy'),
        ('gemma-7b-it', 'Gemma 7B IT - Legacy'),
        ('llama-3.2-90b-text-preview', 'Llama 3.2 90B Text Preview - Legacy'),
    ]
    
    # Singleton instance ID
    id = models.IntegerField(primary_key=True, default=1, editable=False)
    
    # API Configuration
    api_key = models.CharField(
        max_length=500,
        blank=True,
        help_text="Groq API Key (leave empty to use environment variable GROQ_API_KEY)"
    )
    model = models.CharField(
        max_length=100,
        choices=MODEL_CHOICES,
        default='llama-3.1-8b-instant',
        help_text="LLM model to use for chatbot responses"
    )
    
    # Response Settings
    max_tokens = models.IntegerField(
        default=500,
        help_text="Maximum tokens for AI responses"
    )
    temperature = models.FloatField(
        default=0.7,
        help_text="Temperature for AI responses (0.0-2.0, higher = more creative)"
    )
    
    # Feature Flags
    is_active = models.BooleanField(
        default=True,
        help_text="Enable/disable chatbot functionality"
    )
    auto_populate_context = models.BooleanField(
        default=True,
        help_text="Automatically populate default contexts on startup"
    )
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chatbot_settings_updates'
    )
    
    class Meta:
        verbose_name = 'Chatbot Settings'
        verbose_name_plural = 'Chatbot Settings'
    
    def __str__(self):
        return "Chatbot Settings"
    
    def clean(self):
        """Ensure only one instance exists"""
        if not self.id:
            self.id = 1
        if ChatbotSettings.objects.exclude(id=self.id).exists():
            raise ValidationError("Only one ChatbotSettings instance is allowed.")
    
    def save(self, *args, **kwargs):
        """Override save to ensure singleton"""
        self.id = 1
        self.clean()
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance"""
        settings, created = cls.objects.get_or_create(id=1)
        return settings
    
    def get_api_key(self):
        """Get API key from settings or environment variable"""
        from django.conf import settings as django_settings
        if self.api_key:
            return self.api_key
        return getattr(django_settings, 'GROQ_API_KEY', None)
    
    def get_model(self):
        """Get model from settings or environment variable"""
        from django.conf import settings as django_settings
        if self.model:
            return self.model
        return getattr(django_settings, 'GROQ_MODEL', 'llama-3.1-8b-instant')
