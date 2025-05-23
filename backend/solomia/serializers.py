from rest_framework import serializers
from .models import AIChatMessage


class AIChatMessageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для сообщений чата AI
    """
    class Meta:
        model = AIChatMessage
        fields = ['id', 'role', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    """
    Сериализатор для запросов к чату
    """
    message = serializers.CharField(required=True, allow_blank=False)


class ChatHistoryResponseSerializer(serializers.Serializer):
    """
    Сериализатор для ответов с историей чата
    """
    messages = AIChatMessageSerializer(many=True)
