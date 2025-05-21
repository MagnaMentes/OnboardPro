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
