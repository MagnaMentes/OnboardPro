from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели уведомлений
    """
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message',
                  'notification_type', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'message',
                            'notification_type', 'created_at']


class NotificationSettingsSerializer(serializers.Serializer):
    """
    Сериализатор для настроек уведомлений пользователя
    """
    info = serializers.BooleanField(required=False, default=True)
    warning = serializers.BooleanField(required=False, default=True)
    deadline = serializers.BooleanField(required=False, default=True)
    system = serializers.BooleanField(required=False, default=True)
