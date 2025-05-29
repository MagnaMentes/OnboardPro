from rest_framework import serializers
from django.contrib.auth import get_user_model
from departments.serializers import DepartmentSerializer
from onboarding.models import OnboardingStep, UserStepProgress
from onboarding.lms_models import LMSTest, LMSUserTestResult
from onboarding.serializers import UserStepProgressSerializer
from onboarding.lms_serializers import LMSUserTestResultSerializer as TestResultSerializer
from gamification.serializers import UserRewardSerializer
from ai_insights.serializers import AIInsightSerializer

User = get_user_model()


class UserAnalyticsSerializer(serializers.ModelSerializer):
    """Сериализатор для получения аналитики по отдельному пользователю"""
    department = DepartmentSerializer(read_only=True)
    onboarding_progress = UserStepProgressSerializer(
        source='step_progress', many=True, read_only=True)
    test_results = TestResultSerializer(
        source='lms_test_results', many=True, read_only=True)
    rewards = UserRewardSerializer(
        source='rewards', many=True, read_only=True)
    ai_insights = AIInsightSerializer(
        source='ai_insights', many=True, read_only=True)

    # Дополнительные поля для аналитики
    completed_steps_count = serializers.SerializerMethodField()
    total_steps_count = serializers.SerializerMethodField()
    avg_test_score = serializers.SerializerMethodField()
    feedback_count = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    risk_score = serializers.SerializerMethodField()
    engagement_score = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name', 'position',
            'department', 'role', 'is_active', 'created_at',
            'onboarding_progress', 'test_results', 'rewards',
            'ai_insights', 'completed_steps_count',
            'total_steps_count', 'avg_test_score', 'feedback_count',
            'last_activity', 'risk_score', 'engagement_score'
        ]

    def get_completed_steps_count(self, obj):
        return 0

    def get_total_steps_count(self, obj):
        return 0

    def get_avg_test_score(self, obj):
        return 0.0

    def get_feedback_count(self, obj):
        return 0

    def get_last_activity(self, obj):
        return None

    def get_risk_score(self, obj):
        return 0.0

    def get_engagement_score(self, obj):
        return 0.0
