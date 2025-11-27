from rest_framework import serializers
from .models import NewsletterSubscriber, NewsletterCampaign

class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    """Serializer for newsletter subscribers"""
    class Meta:
        model = NewsletterSubscriber
        fields = '__all__'

class NewsletterCampaignSerializer(serializers.ModelSerializer):
    """Serializer for newsletter campaigns"""
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = NewsletterCampaign
        fields = '__all__'
        read_only_fields = [
            'id',
            'created_by',
            'created_at',
            'updated_at',
            'sent_at',
            'recipients_count',
            'opened_count',
            'clicked_count',
        ]

    def get_created_by_name(self, obj):
        """Get full name of creator or fallback to username/email"""
        if obj.created_by:
            full_name = obj.created_by.get_full_name()
            if full_name:
                return full_name
            return obj.created_by.username or obj.created_by.email or 'Unknown'
        return 'Unknown'
