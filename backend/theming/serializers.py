from rest_framework import serializers
from theming.models import Theme, Event


class ThemeSerializer(serializers.Serializer):
    theme_key = serializers.CharField()
    theme = serializers.DictField()
    event = serializers.DictField(allow_null=True)


class ThemeModelSerializer(serializers.ModelSerializer):
    """Serializer for Theme model"""
    class Meta:
        model = Theme
        fields = [
            'id', 'key', 'name', 'primary_color', 'secondary_color',
            'background_color', 'text_color', 'accent_color',
            'banner', 'hero_background', 'icons_path', 'animations',
            'popup_title', 'popup_content',
            'landing_popup_enabled', 'landing_popup_title', 'landing_popup_subtitle',
            'landing_popup_description', 'landing_popup_button_text',
            'landing_popup_image_url', 'landing_popup_overlay_text',
            'is_custom', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ThemeDetailSerializer(serializers.ModelSerializer):
    """Serializer that returns theme in format compatible with THEMES config"""
    config = serializers.SerializerMethodField()
    
    class Meta:
        model = Theme
        fields = ['key', 'name', 'config', 'is_custom']
    
    def get_config(self, obj):
        return obj.to_dict()


class EventModelSerializer(serializers.ModelSerializer):
    """Serializer for Event model"""
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'slug', 'start_date', 'end_date',
            'theme_key', 'priority', 'active', 'recurring_yearly',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

