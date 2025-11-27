from rest_framework import serializers

from .models import Testimonial


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = '__all__'


class TestimonialCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ['name', 'feedback', 'rating', 'service_type']
        extra_kwargs = {
            'status': {'required': False, 'read_only': True},  # Status is set automatically
            'service_type': {'required': False, 'allow_blank': True, 'allow_null': True}
        }

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate_service_type(self, value):
        if value:
            valid_choices = [choice[0] for choice in Testimonial.SERVICE_CHOICES]
            if value not in valid_choices:
                raise serializers.ValidationError('Invalid service type selected.')
        return value

    def create(self, validated_data):
        # Set status to approved (published) for public submissions
        # Admins can archive/delete later if needed
        validated_data.setdefault('status', 'approved')
        return super().create(validated_data)


