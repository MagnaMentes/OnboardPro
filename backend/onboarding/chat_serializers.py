"""
Сериализаторы для AI-чата Solomia
"""
from rest_framework import serializers
from .solomia_models import AIChatMessage


class AIChatMessageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели сообщений AI-чата
    """
    class Meta:
        model = AIChatMessage
        fields = ['id', 'role', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatMessageInputSerializer(serializers.Serializer):
    """
    Сериализатор для входящих сообщений AI-чата
    """
    message = serializers.CharField(max_length=2000, required=True)
