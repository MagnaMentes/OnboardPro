from rest_framework import serializers
from .feedback_models import FeedbackMood, StepFeedback
from django.utils import timezone
from datetime import timedelta


class FeedbackMoodSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели настроения по назначению
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    assignment_program_name = serializers.CharField(
        source='assignment.program.name', read_only=True)
    value_display = serializers.CharField(
        source='get_value_display', read_only=True)

    class Meta:
        model = FeedbackMood
        fields = [
            'id', 'user', 'user_email', 'assignment', 'assignment_program_name',
            'value', 'value_display', 'comment', 'created_at'
        ]
        read_only_fields = ['created_at', 'user_email',
                            'assignment_program_name', 'value_display']

    def validate(self, data):
        """
        Проверяет, что пользователь отправляет только один FeedbackMood в день
        на одно назначение.
        """
        user = data.get('user')
        assignment = data.get('assignment')

        # Если пользователь не указан, берем из контекста запроса
        if not user and self.context.get('request'):
            user = self.context['request'].user
            data['user'] = user

        # Проверка наличия обратной связи за сегодня
        today = timezone.now().date()
        today_feedback = FeedbackMood.objects.filter(
            user=user,
            assignment=assignment,
            created_at__date=today
        ).exists()

        if today_feedback:
            raise serializers.ValidationError(
                "Вы уже отправили обратную связь по настроению сегодня.")

        return data


class StepFeedbackSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели отзыва по конкретному шагу
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    step_name = serializers.CharField(source='step.name', read_only=True)
    auto_tag_display = serializers.CharField(
        source='get_auto_tag_display', read_only=True)

    class Meta:
        model = StepFeedback
        fields = [
            'id', 'user', 'user_email', 'step', 'step_name',
            'assignment', 'comment', 'auto_tag', 'auto_tag_display',
            'sentiment_score', 'created_at'
        ]
        read_only_fields = [
            'created_at', 'user_email', 'step_name',
            'auto_tag', 'auto_tag_display', 'sentiment_score'
        ]

    def validate(self, data):
        """
        Проверка на существование назначения с указанным шагом
        """
        user = data.get('user')
        step = data.get('step')
        assignment = data.get('assignment')

        # Если пользователь не указан, берем из контекста запроса
        if not user and self.context.get('request'):
            user = self.context['request'].user
            data['user'] = user

        # Проверяем, что шаг принадлежит программе назначения
        if step.program != assignment.program:
            raise serializers.ValidationError(
                "Указанный шаг не принадлежит программе назначения.")

        # Проверяем, что назначение принадлежит пользователю
        if assignment.user != user:
            raise serializers.ValidationError(
                "Указанное назначение не принадлежит пользователю.")

        return data


class AssignmentFeedbackSerializer(serializers.Serializer):
    """
    Сериализатор для получения всей обратной связи по конкретному назначению
    """
    assignment_id = serializers.IntegerField()
    program_name = serializers.CharField(read_only=True)
    user_email = serializers.CharField(read_only=True)
    moods = serializers.SerializerMethodField()
    step_feedbacks = serializers.SerializerMethodField()

    def get_moods(self, obj):
        """Получает все записи настроения для назначения"""
        moods = FeedbackMood.objects.filter(assignment_id=obj['assignment_id'])
        return FeedbackMoodSerializer(moods, many=True).data

    def get_step_feedbacks(self, obj):
        """Получает все отзывы по шагам для назначения"""
        feedbacks = StepFeedback.objects.filter(
            assignment_id=obj['assignment_id'])
        return StepFeedbackSerializer(feedbacks, many=True).data
