from rest_framework import serializers

from .models import ActivityLog
from .utils import get_activity_icon


class ActivityLogSerializer(serializers.ModelSerializer):
    """API representation for activity log entries."""

    activity_label = serializers.CharField(source='get_activity_type_display', read_only=True)
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'activity_type',
            'activity_label',
            'description',
            'timestamp',
            'user_name',
            'user_email',
            'ip_address',
            'icon',
        ]

    @staticmethod
    def _get_user_display(user):
        if not user:
            return None
        full_name = user.get_full_name()
        return full_name or user.email or user.username

    def get_user_name(self, obj):
        return self._get_user_display(obj.user) or "System"

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_icon(self, obj):
        return get_activity_icon(obj.activity_type)

