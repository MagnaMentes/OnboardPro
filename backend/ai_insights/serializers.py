from rest_framework import serializers
from .models import AIInsight, AIRecommendation


class AIInsightSerializer(serializers.ModelSerializer):
    """
    Сериализатор для AI-инсайтов
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(
        source='user.full_name', read_only=True)
    program_name = serializers.CharField(
        source='assignment.program.name', read_only=True)
    risk_level_display = serializers.CharField(
        source='get_risk_level_display', read_only=True)

    class Meta:
        model = AIInsight
        fields = [
            'id',
            'user',
            'user_email',
            'user_full_name',
            'assignment',
            'program_name',
            'risk_level',
            'risk_level_display',
            'reason',
            'created_at'
        ]
        read_only_fields = ['created_at']


class AIRecommendationSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели AI-рекомендаций
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    assignment_name = serializers.CharField(
        source='assignment.program.name', read_only=True)
    step_name = serializers.SerializerMethodField()

    class Meta:
        model = AIRecommendation
        fields = [
            'id', 'user', 'user_email', 'assignment', 'assignment_name',
            'step', 'step_name', 'recommendation_text', 'generated_at', 'dismissed'
        ]
        read_only_fields = [
            'user', 'user_email', 'assignment', 'assignment_name',
            'step', 'step_name', 'recommendation_text', 'generated_at'
        ]

    def get_step_name(self, obj):
        """
        Получает название шага, если он указан
        """
        if obj.step:
            return obj.step.name
        return None
