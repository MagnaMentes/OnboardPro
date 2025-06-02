# Импорт сериализаторов для доступности через пакет
from .dashboard_serializers import *

# Вместо импорта из других модулей, определяем все необходимые сериализаторы здесь
# Импортируем необходимые модели
from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import (
    FeedbackTemplate, FeedbackQuestion, UserFeedback,
    FeedbackAnswer, FeedbackInsight
)

User = get_user_model()


class FeedbackQuestionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для вопроса обратной связи
    """
    class Meta:
        model = FeedbackQuestion
        fields = ['id', 'text', 'type', 'order', 'required', 'options']


class FeedbackTemplateListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка шаблонов обратной связи
    """
    creator_email = serializers.EmailField(
        source='creator.email', read_only=True)
    question_count = serializers.SerializerMethodField()
    type_display = serializers.CharField(
        source='get_type_display', read_only=True)

    class Meta:
        model = FeedbackTemplate
        fields = [
            'id', 'title', 'description', 'type', 'type_display',
            'created_at', 'creator_email', 'question_count'
        ]

    def get_question_count(self, obj):
        return obj.questions.count()


class FeedbackTemplateDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детального представления шаблона обратной связи
    """
    questions = FeedbackQuestionSerializer(many=True, read_only=True)
    creator_email = serializers.EmailField(
        source='creator.email', read_only=True)
    type_display = serializers.CharField(
        source='get_type_display', read_only=True)

    class Meta:
        model = FeedbackTemplate
        fields = [
            'id', 'title', 'description', 'type', 'type_display',
            'created_at', 'creator_email', 'questions'
        ]


class UserFeedbackCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания отзыва пользователя
    """
    answers = serializers.JSONField()

    class Meta:
        model = UserFeedback
        fields = ['template', 'subject', 'answers', 'anonymous']


class UserFeedbackListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка отзывов пользователей
    """
    template_title = serializers.CharField(
        source='template.title', read_only=True)
    subject_name = serializers.CharField(
        source='subject.full_name', read_only=True)
    submitter_name = serializers.CharField(
        source='submitter.full_name', read_only=True)
    score = serializers.FloatField(read_only=True)

    class Meta:
        model = UserFeedback
        fields = [
            'id', 'template_title', 'subject_name', 'submitter_name',
            'score', 'submitted_at', 'anonymous'
        ]


class UserFeedbackDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детального представления отзыва пользователя
    """
    template_title = serializers.CharField(
        source='template.title', read_only=True)
    template_type = serializers.CharField(
        source='template.type', read_only=True)
    subject_name = serializers.CharField(
        source='subject.full_name', read_only=True)
    submitter_name = serializers.SerializerMethodField()
    answers_data = serializers.SerializerMethodField()

    class Meta:
        model = UserFeedback
        fields = [
            'id', 'template_title', 'template_type', 'subject_name',
            'submitter_name', 'answers_data', 'submitted_at', 'anonymous'
        ]

    def get_submitter_name(self, obj):
        if obj.anonymous:
            return "Анонимно"
        return obj.submitter.full_name

    def get_answers_data(self, obj):
        # Преобразуем ответы в формат вопрос-ответ
        result = []
        answers = obj.answers
        questions = {q.id: q for q in obj.template.questions.all()}

        for answer_id, answer_value in answers.items():
            question = questions.get(int(answer_id))
            if question:
                result.append({
                    'question': question.text,
                    'question_type': question.type,
                    'answer': answer_value
                })

        return result


class FeedbackInsightSerializer(serializers.ModelSerializer):
    """
    Сериализатор для аналитических выводов по обратной связи
    """
    class Meta:
        model = FeedbackInsight
        fields = [
            'id', 'user', 'feedback_type', 'insight_type',
            'content', 'generated_at', 'score'
        ]
