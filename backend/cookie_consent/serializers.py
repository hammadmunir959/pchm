from rest_framework import serializers
from .models import CookieConsent

class CookieConsentSerializer(serializers.ModelSerializer):
    """Serializer for cookie consent"""
    class Meta:
        model = CookieConsent
        fields = '__all__'
        read_only_fields = ['consented_at', 'last_updated']

class CookieConsentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating cookie consent"""
    class Meta:
        model = CookieConsent
        fields = [
            'session_id', 'analytics_cookies', 'marketing_cookies',
            'functional_cookies', 'ip_address', 'user_agent'
        ]

    def create(self, validated_data):
        # Set user if authenticated
        if self.context['request'].user.is_authenticated:
            validated_data['user'] = self.context['request'].user

        return super().create(validated_data)
