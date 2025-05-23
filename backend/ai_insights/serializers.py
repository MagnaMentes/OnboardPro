from rest_framework import serializers
from .models import AIInsight


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
