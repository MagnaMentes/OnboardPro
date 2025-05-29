from rest_framework import serializers
from .models import (
    FeedbackTemplate, FeedbackQuestion, UserFeedback,
    FeedbackAnswer, FeedbackInsight
)
from django.contrib.auth import get_user_model

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
        fields = ['id', 'title', 'description', 'type', 'type_display',
                  'creator_email', 'is_anonymous', 'question_count', 'created_at']

    def get_question_count(self, obj):
        return obj.questions.count()


class FeedbackTemplateDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детального представления шаблона обратной связи
    """
    creator_email = serializers.EmailField(
        source='creator.email', read_only=True)
    questions = FeedbackQuestionSerializer(many=True)
    type_display = serializers.CharField(
        source='get_type_display', read_only=True)

    class Meta:
        model = FeedbackTemplate
        fields = ['id', 'title', 'description', 'type', 'type_display',
                  'creator_email', 'is_anonymous', 'questions', 'created_at']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        template = FeedbackTemplate.objects.create(**validated_data)

        for question_data in questions_data:
            FeedbackQuestion.objects.create(template=template, **question_data)

        return template

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)

        # Обновляем поля шаблона
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Если есть данные для вопросов
        if questions_data is not None:
            # Удаляем существующие вопросы
            instance.questions.all().delete()

            # Создаем новые вопросы
            for question_data in questions_data:
                FeedbackQuestion.objects.create(
                    template=instance, **question_data)

        return instance


class FeedbackAnswerSerializer(serializers.ModelSerializer):
    """
    Сериализатор для ответов на вопросы обратной связи
    """
    question_text = serializers.CharField(
        source='question.text', read_only=True)
    question_type = serializers.CharField(
        source='question.type', read_only=True)

    class Meta:
        model = FeedbackAnswer
        fields = ['id', 'question', 'question_text', 'question_type',
                  'text_answer', 'scale_answer', 'choice_answer']


class FeedbackAnswerCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания ответов на вопросы обратной связи
    """
    class Meta:
        model = FeedbackAnswer
        fields = ['question', 'text_answer', 'scale_answer', 'choice_answer']


class UserFeedbackCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания обратной связи
    """
    answers = FeedbackAnswerCreateSerializer(many=True)

    class Meta:
        model = UserFeedback
        fields = ['template', 'user', 'submitter',
                  'onboarding_step', 'is_anonymous', 'answers']

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        user_feedback = UserFeedback.objects.create(**validated_data)

        for answer_data in answers_data:
            FeedbackAnswer.objects.create(
                feedback=user_feedback, **answer_data)

        return user_feedback


class UserFeedbackListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка обратной связи
    """
    template_title = serializers.CharField(
        source='template.title', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_fullname = serializers.SerializerMethodField()
    submitter_email = serializers.EmailField(
        source='submitter.email', read_only=True)
    step_name = serializers.CharField(
        source='onboarding_step.name', read_only=True)
    answer_count = serializers.SerializerMethodField()

    class Meta:
        model = UserFeedback
        fields = ['id', 'template', 'template_title', 'user', 'user_email',
                  'user_fullname', 'submitter_email', 'onboarding_step',
                  'step_name', 'is_anonymous', 'answer_count', 'created_at']

    def get_user_fullname(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_answer_count(self, obj):
        return obj.answers.count()


class UserFeedbackDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детального представления обратной связи
    """
    template_title = serializers.CharField(
        source='template.title', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_fullname = serializers.SerializerMethodField()
    submitter_email = serializers.EmailField(
        source='submitter.email', read_only=True)
    step_name = serializers.CharField(
        source='onboarding_step.name', read_only=True)
    answers = FeedbackAnswerSerializer(many=True, read_only=True)
    insights = serializers.SerializerMethodField()

    class Meta:
        model = UserFeedback
        fields = ['id', 'template', 'template_title', 'user', 'user_email',
                  'user_fullname', 'submitter_email', 'onboarding_step',
                  'step_name', 'is_anonymous', 'answers', 'insights', 'created_at']

    def get_user_fullname(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_insights(self, obj):
        insights = obj.insights.all()
        return FeedbackInsightSerializer(insights, many=True).data


class FeedbackInsightSerializer(serializers.ModelSerializer):
    """
    Сериализатор для AI-анализа обратной связи
    """
    type_display = serializers.CharField(
        source='get_type_display', read_only=True)

    class Meta:
        model = FeedbackInsight
        fields = ['id', 'type', 'type_display',
                  'content', 'confidence_score', 'created_at']
