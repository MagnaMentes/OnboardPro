from rest_framework import serializers
from onboarding.lms_models_v2 import (
    LearningModule, Lesson, Attachment, EnhancedLMSQuestion,
    OpenAnswerOption, EnhancedTestSettings, UserTestAttempt,
    UserOpenAnswer, LessonProgress
)
from onboarding.serializers import OnboardingStepSerializer
from onboarding.lms_serializers import LMSTestSerializer


class AttachmentSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели вложений к урокам
    """
    class Meta:
        model = Attachment
        fields = [
            'id', 'title', 'description', 'attachment_type',
            'file_path', 'external_url', 'order', 'created_at'
        ]
        read_only_fields = ['created_at']


class LessonSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели уроков
    """
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'description', 'content', 'content_type',
            'module', 'order', 'estimated_minutes', 'created_at',
            'updated_at', 'attachments'
        ]
        read_only_fields = ['created_at', 'updated_at']


class LessonDetailSerializer(LessonSerializer):
    """
    Расширенный сериализатор для одного урока со всеми вложениями
    """
    progress_status = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta(LessonSerializer.Meta):
        fields = LessonSerializer.Meta.fields + \
            ['progress_status', 'progress_percent']

    def get_progress_status(self, obj):
        user = self.context['request'].user
        try:
            progress = obj.user_progress.get(user=user)
            return progress.status
        except LessonProgress.DoesNotExist:
            return 'not_started'

    def get_progress_percent(self, obj):
        user = self.context['request'].user
        try:
            progress = obj.user_progress.get(user=user)
            return progress.progress_percent
        except LessonProgress.DoesNotExist:
            return 0


class LearningModuleSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели учебных модулей
    """
    lessons = LessonSerializer(many=True, read_only=True)
    step_name = serializers.CharField(source='step.name', read_only=True)

    class Meta:
        model = LearningModule
        fields = [
            'id', 'title', 'description', 'step', 'step_name',
            'order', 'created_at', 'updated_at', 'created_by', 'lessons'
        ]
        read_only_fields = ['created_at', 'updated_at', 'step_name']


class OpenAnswerOptionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для правильных ответов на открытые вопросы
    """
    class Meta:
        model = OpenAnswerOption
        fields = ['id', 'text', 'is_case_sensitive', 'match_exact']
        # Скрываем поля при чтении для конечных пользователей
        extra_kwargs = {
            'text': {'write_only': True},
            'is_case_sensitive': {'write_only': True},
            'match_exact': {'write_only': True}
        }


class EnhancedLMSQuestionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для расширенных вопросов тестов
    """
    open_answer_options = OpenAnswerOptionSerializer(many=True, read_only=True)

    class Meta:
        model = EnhancedLMSQuestion
        fields = [
            'id', 'text', 'question_type', 'test',
            'order', 'explanation', 'open_answer_options'
        ]


class EnhancedTestSettingsSerializer(serializers.ModelSerializer):
    """
    Сериализатор для настроек расширенных тестов
    """
    class Meta:
        model = EnhancedTestSettings
        fields = [
            'id', 'test', 'time_limit_minutes', 'passing_score_percent',
            'show_correct_answers', 'randomize_questions', 'max_attempts'
        ]


class UserTestAttemptSerializer(serializers.ModelSerializer):
    """
    Сериализатор для попыток прохождения тестов
    """
    test_title = serializers.CharField(source='test.title', read_only=True)
    time_spent_formatted = serializers.SerializerMethodField()

    class Meta:
        model = UserTestAttempt
        fields = [
            'id', 'user', 'test', 'test_title', 'started_at',
            'completed_at', 'score', 'max_score', 'is_passed',
            'time_spent_seconds', 'time_spent_formatted'
        ]
        read_only_fields = ['started_at', 'test_title']

    def get_time_spent_formatted(self, obj):
        """
        Форматирует время в удобном для чтения формате (мм:сс)
        """
        minutes = obj.time_spent_seconds // 60
        seconds = obj.time_spent_seconds % 60
        return f"{minutes}:{seconds:02d}"


class UserOpenAnswerSerializer(serializers.ModelSerializer):
    """
    Сериализатор для открытых ответов пользователей
    """
    question_text = serializers.CharField(
        source='question.text', read_only=True)

    class Meta:
        model = UserOpenAnswer
        fields = [
            'id', 'user', 'question', 'question_text',
            'answer_text', 'is_correct', 'attempt', 'answered_at'
        ]
        read_only_fields = ['answered_at', 'question_text']


class LessonProgressSerializer(serializers.ModelSerializer):
    """
    Сериализатор для прогресса по урокам
    """
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id', 'user', 'lesson', 'lesson_title', 'status',
            'progress_percent', 'last_accessed', 'completed_at',
            'time_spent_seconds'
        ]
        read_only_fields = ['last_accessed', 'completed_at', 'lesson_title']


class EnhancedTestSerializer(serializers.ModelSerializer):
    """
    Расширенный сериализатор для тестов с настройками
    """
    enhanced_settings = EnhancedTestSettingsSerializer(read_only=True)
    enhanced_questions = EnhancedLMSQuestionSerializer(
        many=True, read_only=True)
    test = LMSTestSerializer()
    user_attempts = serializers.SerializerMethodField()

    class Meta:
        model = EnhancedTestSettings
        fields = [
            'test', 'enhanced_settings', 'enhanced_questions', 'user_attempts'
        ]

    def get_user_attempts(self, obj):
        # Получаем последние 3 попытки текущего пользователя
        user = self.context['request'].user
        attempts = UserTestAttempt.objects.filter(
            user=user,
            test=obj.test
        ).order_by('-started_at')[:3]

        return UserTestAttemptSerializer(attempts, many=True).data


class OpenAnswerSubmitSerializer(serializers.Serializer):
    """
    Сериализатор для отправки открытых ответов
    """
    question_id = serializers.IntegerField()
    answer_text = serializers.CharField()


class TestSubmitRequestSerializer(serializers.Serializer):
    """
    Сериализатор для запроса на отправку ответов на тест
    """
    test_id = serializers.IntegerField()
    attempt_id = serializers.IntegerField(required=False)
    answers = serializers.ListField(
        child=serializers.DictField()
    )
    time_spent_seconds = serializers.IntegerField(required=False)


class CreateLearningModuleSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания учебного модуля
    """
    class Meta:
        model = LearningModule
        fields = [
            'title', 'description', 'step',
            'order', 'created_by'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['created_by'] = user
        return super().create(validated_data)


class CreateLessonSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания урока
    """
    class Meta:
        model = Lesson
        fields = [
            'title', 'description', 'content', 'content_type',
            'module', 'order', 'estimated_minutes'
        ]


class CreateAttachmentSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания вложения
    """
    class Meta:
        model = Attachment
        fields = [
            'lesson', 'title', 'description',
            'attachment_type', 'file_path', 'external_url', 'order'
        ]
