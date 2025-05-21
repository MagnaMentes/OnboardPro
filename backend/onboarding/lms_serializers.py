from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import OnboardingStep, UserStepProgress
from .lms_models import (
    LMSModule, LMSTest, LMSQuestion, LMSOption, LMSUserAnswer, LMSUserTestResult
)

User = get_user_model()


class LMSModuleSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели обучающего модуля LMS
    """
    step_name = serializers.CharField(source='step.name', read_only=True)

    class Meta:
        model = LMSModule
        fields = [
            'id', 'title', 'description', 'content_type', 'content',
            'order', 'step', 'step_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'step_name']


class LMSOptionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели варианта ответа LMS
    """
    class Meta:
        model = LMSOption
        fields = ['id', 'text', 'is_correct', 'order']
        # Скрываем правильный ответ при чтении
        extra_kwargs = {'is_correct': {'write_only': True}}


class LMSQuestionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели вопроса теста LMS
    """
    options = LMSOptionSerializer(many=True, read_only=True)

    class Meta:
        model = LMSQuestion
        fields = ['id', 'text', 'order', 'options']


class LMSTestSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели теста LMS
    """
    questions = LMSQuestionSerializer(many=True, read_only=True)
    step_name = serializers.CharField(source='step.name', read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = LMSTest
        fields = [
            'id', 'title', 'description', 'step', 'step_name',
            'questions', 'created_at', 'updated_at', 'is_completed'
        ]
        read_only_fields = ['created_at',
                            'updated_at', 'step_name', 'is_completed']

    def get_is_completed(self, obj):
        """
        Проверяет, прошел ли текущий пользователь тест
        """
        user = self.context.get('request').user
        return LMSUserTestResult.objects.filter(
            user=user,
            test=obj,
            is_passed=True
        ).exists()


class LMSUserAnswerSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели ответа пользователя на вопрос теста LMS
    """
    class Meta:
        model = LMSUserAnswer
        fields = ['question', 'selected_option']


class TestSubmitSerializer(serializers.Serializer):
    """
    Сериализатор для отправки ответов на тест
    """
    answers = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
            allow_empty=False
        ),
        allow_empty=False
    )

    def validate_answers(self, value):
        """
        Проверка ответов на тест
        """
        step_id = self.context.get('step_id')
        user = self.context.get('request').user

        # Проверяем существование теста для данного шага
        try:
            test = LMSTest.objects.get(step_id=step_id)
        except LMSTest.DoesNotExist:
            raise serializers.ValidationError(
                "Тест не найден для данного шага")

        # Проверяем, что пользователь еще не прошел тест
        if LMSUserTestResult.objects.filter(user=user, test=test).exists():
            raise serializers.ValidationError("Вы уже прошли этот тест")

        # Проверяем формат ответов
        question_ids = set()
        for answer in value:
            if 'question' not in answer or 'selected_option' not in answer:
                raise serializers.ValidationError(
                    "Каждый ответ должен содержать 'question' и 'selected_option'"
                )

            question_id = answer['question']
            option_id = answer['selected_option']

            # Проверяем, что вопрос принадлежит тесту
            try:
                question = LMSQuestion.objects.get(id=question_id, test=test)
            except LMSQuestion.DoesNotExist:
                raise serializers.ValidationError(
                    f"Вопрос с ID {question_id} не найден в тесте")

            # Проверяем, что вариант ответа принадлежит вопросу
            try:
                LMSOption.objects.get(id=option_id, question=question)
            except LMSOption.DoesNotExist:
                raise serializers.ValidationError(
                    f"Вариант ответа с ID {option_id} не найден для вопроса {question_id}"
                )

            # Проверяем на дубликаты вопросов
            if question_id in question_ids:
                raise serializers.ValidationError(
                    f"Дублирующийся ответ на вопрос {question_id}")

            question_ids.add(question_id)

        # Проверяем, что все вопросы теста получили ответы
        test_question_count = test.questions.count()
        if len(question_ids) != test_question_count:
            raise serializers.ValidationError(
                f"Необходимо ответить на все вопросы теста ({test_question_count})"
            )

        return value

    def save(self, **kwargs):
        """
        Сохранение ответов пользователя и определение результата теста
        """
        step_id = self.context.get('step_id')
        user = self.context.get('request').user
        answers = self.validated_data['answers']

        test = LMSTest.objects.get(step_id=step_id)

        with transaction.atomic():
            # Сохраняем ответы пользователя
            correct_answers = 0
            total_questions = len(answers)

            for answer_data in answers:
                question_id = answer_data['question']
                option_id = answer_data['selected_option']

                question = LMSQuestion.objects.get(id=question_id)
                selected_option = LMSOption.objects.get(id=option_id)

                # Создаем запись ответа пользователя
                LMSUserAnswer.objects.create(
                    user=user,
                    question=question,
                    selected_option=selected_option
                )

                # Подсчитываем правильные ответы
                if selected_option.is_correct:
                    correct_answers += 1

            # Определяем, прошел ли пользователь тест (все ответы должны быть правильными)
            is_passed = (correct_answers == total_questions)

            # Сохраняем результат теста
            test_result = LMSUserTestResult.objects.create(
                user=user,
                test=test,
                is_passed=is_passed,
                score=correct_answers,
                max_score=total_questions
            )

            # Если тест пройден успешно, отмечаем шаг как выполненный
            if is_passed:
                progress, created = UserStepProgress.objects.get_or_create(
                    user=user,
                    step_id=step_id,
                    defaults={
                        'status': UserStepProgress.ProgressStatus.NOT_STARTED}
                )
                progress.mark_as_done()

            return test_result


class LMSUserTestResultSerializer(serializers.ModelSerializer):
    """
    Сериализатор для результата прохождения теста пользователем
    """
    test_title = serializers.CharField(source='test.title', read_only=True)
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = LMSUserTestResult
        fields = [
            'id', 'user', 'test', 'test_title', 'is_passed',
            'score', 'max_score', 'percentage', 'completed_at'
        ]
        read_only_fields = ['user', 'test', 'test_title', 'is_passed',
                            'score', 'max_score', 'completed_at']

    def get_percentage(self, obj):
        """
        Возвращает процент правильных ответов
        """
        if obj.max_score == 0:
            return 0
        return int((obj.score / obj.max_score) * 100)
