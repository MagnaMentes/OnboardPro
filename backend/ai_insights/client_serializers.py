from rest_framework import serializers
from .client_models import ClientAIInsight


class ClientAIInsightSerializer(serializers.ModelSerializer):
    """
    Сериализатор для AI-подсказок для клиентов
    """
    step_name = serializers.CharField(source='step.name', read_only=True)
    program_name = serializers.CharField(
        source='assignment.program.name', read_only=True)

    class Meta:
        model = ClientAIInsight
        fields = [
            'id',
            'user',
            'assignment',
            'step',
            'step_name',
            'program_name',
            'hint_text',
            'generated_at',
            'dismissed'
        ]
        read_only_fields = ['user', 'assignment',
                            'step', 'hint_text', 'generated_at']
