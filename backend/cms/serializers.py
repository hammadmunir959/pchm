from rest_framework import serializers

from .models import LandingPageConfig, TeamMember


class LandingPageConfigSerializer(serializers.ModelSerializer):
    """Serializer for simplified landing page configuration."""

    hero_video_url = serializers.SerializerMethodField()
    logo_light_url = serializers.SerializerMethodField()
    logo_dark_url = serializers.SerializerMethodField()

    class Meta:
        model = LandingPageConfig
        fields = "__all__"

    def get_hero_video_url(self, obj):
        request = self.context.get("request")
        if request and obj.hero_video:
            return request.build_absolute_uri(obj.hero_video.url)
        return None

    def get_logo_light_url(self, obj):
        request = self.context.get("request")
        if request and obj.logo_light:
            return request.build_absolute_uri(obj.logo_light.url)
        return None

    def get_logo_dark_url(self, obj):
        request = self.context.get("request")
        if request and obj.logo_dark:
            return request.build_absolute_uri(obj.logo_dark.url)
        return None


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for team members displayed on the Our People page."""

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = "__all__"

    def get_image_url(self, obj):
        request = self.context.get("request")
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


