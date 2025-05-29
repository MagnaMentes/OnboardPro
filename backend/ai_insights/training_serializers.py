from rest_framework import serializers
from .training_models import (
    TrainingInsight, UserLearningMetric,
    DepartmentLearningMetric, QuestionDifficultyMetric
)
from users.serializers import UserSerializer
from onboarding.serializers import OnboardingStepSerializer
from departments.serializers import DepartmentSerializer


class TrainingInsightSerializer(serializers.ModelSerializer):
    """
    Сериализатор для AI-инсайтов по обучению
    """
    insight_type_display = serializers.CharField(
        source='get_insight_type_display', read_only=True)
    user_data = UserSerializer(source='user', read_only=True)
    department_data = DepartmentSerializer(source='department', read_only=True)
    step_data = OnboardingStepSerializer(source='step', read_only=True)

    class Meta:
        model = TrainingInsight
        fields = [
            'id', 'title', 'description', 'insight_type',
            'insight_type_display', 'severity', 'user',
            'user_data', 'step', 'step_data', 'test',
            'department', 'department_data', 'question',
            'created_at', 'is_dismissed'
        ]
        read_only_fields = ['created_at', 'insight_type_display']


class UserLearningMetricSerializer(serializers.ModelSerializer):
    """
    Сериализатор для метрик обучения пользователя
    """
    user_email = serializers.CharField(source='user.email', read_only=True)
    step_name = serializers.CharField(source='step.name', read_only=True)
    program_name = serializers.CharField(
        source='assignment.program.name', read_only=True)

    class Meta:
        model = UserLearningMetric
        fields = [
            'id', 'user', 'user_email', 'assignment', 'program_name',
            'step', 'step_name', 'avg_time_per_test', 'avg_attempts_per_test',
            'correct_answer_rate', 'test_completion_rate', 'learning_speed_index',
            'calculated_at'
        ]
        read_only_fields = ['calculated_at',
                            'user_email', 'step_name', 'program_name']


class DepartmentLearningMetricSerializer(serializers.ModelSerializer):
    """
    Сериализатор для метрик обучения по департаментам
    """
    department_name = serializers.CharField(
        source='department.name', read_only=True)
    problematic_step_name = serializers.CharField(
        source='most_problematic_step.name', read_only=True)

    class Meta:
        model = DepartmentLearningMetric
        fields = [
            'id', 'department', 'department_name', 'user_count',
            'avg_test_completion_rate', 'avg_correct_answer_rate',
            'most_problematic_step', 'problematic_step_name',
            'problematic_step_failure_rate', 'calculated_at'
        ]
        read_only_fields = ['calculated_at',
                            'department_name', 'problematic_step_name']


class QuestionDifficultyMetricSerializer(serializers.ModelSerializer):
    """
    Сериализатор для метрик сложности вопросов
    """
    question_text = serializers.CharField(
        source='question.text', read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = QuestionDifficultyMetric
        fields = [
            'id', 'question', 'question_text', 'test', 'test_title',
            'attempts_count', 'success_rate', 'avg_time_seconds',
            'difficulty_score', 'calculated_at'
        ]
        read_only_fields = ['calculated_at', 'question_text', 'test_title']


class UserLearningOverviewSerializer(serializers.Serializer):
    """
    Сериализатор для общего обзора обучения пользователя
    """
    total_tests_completed = serializers.IntegerField()
    total_tests_passed = serializers.IntegerField()
    avg_score_percent = serializers.FloatField()
    total_time_spent_minutes = serializers.IntegerField()
    learning_speed_percentile = serializers.FloatField()
    strongest_area = serializers.CharField()
    weakest_area = serializers.CharField()
    completion_rate = serializers.FloatField()
    user_metrics = UserLearningMetricSerializer(many=True)


class DepartmentTrainingOverviewSerializer(serializers.Serializer):
    """
    Сериализатор для обзора обучения по департаменту с AI-инсайтами
    """
    department = DepartmentSerializer()
    metrics = DepartmentLearningMetricSerializer()
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    avg_completion_rate = serializers.FloatField()
    avg_score = serializers.FloatField()
    top_insights = TrainingInsightSerializer(many=True)
    best_performing_users = UserLearningMetricSerializer(many=True)
    struggling_users = UserLearningMetricSerializer(many=True)
