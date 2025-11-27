from rest_framework import serializers

from .models import Inquiry
from utils.spam_protection import check_rate_limit, validate_recaptcha


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = '__all__'


class InquiryCreateSerializer(serializers.ModelSerializer):
    recaptcha_token = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Inquiry
        fields = [
            'name',
            'email',
            'phone',
            'subject',
            'message',
            'vehicle_interest',
            'recaptcha_token',
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        recaptcha_token = attrs.pop('recaptcha_token', None)

        if not recaptcha_token:
            raise serializers.ValidationError({'recaptcha': 'reCAPTCHA token missing.'})

        ip_address = request.META.get('REMOTE_ADDR') if request else None

        if not validate_recaptcha(recaptcha_token, ip_address):
            raise serializers.ValidationError({'recaptcha': 'reCAPTCHA validation failed.'})

        if ip_address and check_rate_limit(ip_address, 'inquiry'):
            raise serializers.ValidationError(
                {'rate_limit': 'Too many submissions from this IP. Try again later.'}
            )

        attrs['recaptcha_token'] = recaptcha_token
        attrs['ip_address'] = ip_address
        attrs['source'] = 'web'
        return attrs


class InquiryReplySerializer(serializers.Serializer):
    message = serializers.CharField(min_length=3, max_length=4000)


