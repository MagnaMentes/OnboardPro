from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from .models import OnboardingStep, UserStepProgress
from .permissions import IsAssignedUserOrHRorAdmin, IsAdminOrHR
from .lms_models import LMSTest
from .lms_models_v2 import (
    LearningModule, Lesson, Attachment, EnhancedLMSQuestion,
    OpenAnswerOption, EnhancedTestSettings, UserTestAttempt,
    UserOpenAnswer, LessonProgress
)
from .lms_v2_serializers import (
    LearningModuleSerializer, LessonSerializer, AttachmentSerializer,
    EnhancedLMSQuestionSerializer, OpenAnswerOptionSerializer,
    EnhancedTestSettingsSerializer, UserTestAttemptSerializer,
    UserOpenAnswerSerializer, LessonProgressSerializer,
    LessonDetailSerializer, CreateLearningModuleSerializer,
    CreateLessonSerializer, CreateAttachmentSerializer,
    EnhancedTestSerializer, TestSubmitRequestSerializer
)


class LMSEditorViewSet(viewsets.ModelViewSet):
    """
    Набор представлений для редактирования учебных материалов
    Доступен только для HR и Admin
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get_serializer_class(self):
        if self.action == 'create':
            if self.basename == 'learning-module':
                return CreateLearningModuleSerializer
            elif self.basename == 'lesson':
                return CreateLessonSerializer
            elif self.basename == 'attachment':
                return CreateAttachmentSerializer

        if self.basename == 'learning-module':
            return LearningModuleSerializer
        elif self.basename == 'lesson':
            return LessonSerializer
        elif self.basename == 'attachment':
            return AttachmentSerializer

        return super().get_serializer_class()

    def get_queryset(self):
        if self.basename == 'learning-module':
            return LearningModule.objects.all()
        elif self.basename == 'lesson':
            return Lesson.objects.all()
        elif self.basename == 'attachment':
            return Attachment.objects.all()

        return None


class EnhancedLMSQuestionViewSet(viewsets.ModelViewSet):
    """
    Набор представлений для работы с расширенными вопросами тестов
    Доступен только для HR и Admin
    """
    queryset = EnhancedLMSQuestion.objects.all()
    serializer_class = EnhancedLMSQuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]


class OpenAnswerOptionViewSet(viewsets.ModelViewSet):
    """
    Набор представлений для работы с вариантами ответов на открытые вопросы
    Доступен только для HR и Admin
    """
    queryset = OpenAnswerOption.objects.all()
    serializer_class = OpenAnswerOptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]


class EnhancedTestSettingsViewSet(viewsets.ModelViewSet):
    """
    Набор представлений для работы с настройками расширенных тестов
    Доступен только для HR и Admin
    """
    queryset = EnhancedTestSettings.objects.all()
    serializer_class = EnhancedTestSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    @action(detail=True, methods=['post'])
    def update_settings(self, request, pk=None):
        """
        Обновление настроек расширенного теста
        """
        settings = self.get_object()
        serializer = self.get_serializer(
            settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LearningModuleListView(generics.ListAPIView):
    """
    Представление для получения списка учебных модулей для шага онбординга
    """
    serializer_class = LearningModuleSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def get_queryset(self):
        step_id = self.kwargs.get('step_id')
        step = get_object_or_404(OnboardingStep, pk=step_id)
        self.check_object_permissions(self.request, step)
        return LearningModule.objects.filter(step_id=step_id).order_by('order')


class LessonDetailView(generics.RetrieveAPIView):
    """
    Представление для получения детальной информации об уроке
    """
    serializer_class = LessonDetailSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def get_queryset(self):
        return Lesson.objects.all()

    def retrieve(self, request, *args, **kwargs):
        lesson = self.get_object()
        user = request.user

        # Обновляем или создаем запись прогресса при просмотре урока
        progress, created = LessonProgress.objects.update_or_create(
            user=user,
            lesson=lesson,
            defaults={
                'last_accessed': timezone.now(),
                'status': 'in_progress' if created else models.F('status')
            }
        )

        serializer = self.get_serializer(lesson)
        return Response(serializer.data)


class LessonProgressUpdateView(generics.UpdateAPIView):
    """
    Представление для обновления прогресса урока
    """
    serializer_class = LessonProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LessonProgress.objects.filter(user=self.request.user)

    def get_object(self):
        lesson_id = self.kwargs.get('lesson_id')
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        obj, created = LessonProgress.objects.get_or_create(
            user=self.request.user,
            lesson=lesson,
            defaults={
                'status': 'not_started',
                'progress_percent': 0,
                'last_accessed': timezone.now()
            }
        )
        return obj

    def update(self, request, *args, **kwargs):
        progress = self.get_object()

        # Обновляем только разрешенные поля
        allowed_fields = ['progress_percent', 'time_spent_seconds']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        # Автоматически обновляем статус на "completed" при 100% прогрессе
        if 'progress_percent' in data and data['progress_percent'] >= 100:
            data['status'] = 'completed'
            data['completed_at'] = timezone.now()
        elif 'progress_percent' in data and data['progress_percent'] > 0:
            data['status'] = 'in_progress'

        # Всегда обновляем время последнего доступа
        data['last_accessed'] = timezone.now()

        serializer = self.get_serializer(progress, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)


class EnhancedTestDetailView(generics.RetrieveAPIView):
    """
    Представление для получения информации о расширенном тесте
    """
    serializer_class = EnhancedTestSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def get_object(self):
        step_id = self.kwargs.get('step_id')
        step = get_object_or_404(OnboardingStep, pk=step_id)
        self.check_object_permissions(self.request, step)
        test = get_object_or_404(LMSTest, step=step)

        # Получаем или создаем расширенные настройки для теста
        enhanced_settings, created = EnhancedTestSettings.objects.get_or_create(
            test=test,
            defaults={
                'time_limit_minutes': 0,
                'passing_score_percent': 70,
                'show_correct_answers': True,
                'randomize_questions': False,
                'max_attempts': 0
            }
        )

        return enhanced_settings


class StartTestAttemptView(generics.CreateAPIView):
    """
    Представление для начала новой попытки теста
    """
    serializer_class = UserTestAttemptSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def create(self, request, *args, **kwargs):
        test_id = request.data.get('test_id')
        test = get_object_or_404(LMSTest, pk=test_id)
        step = test.step

        # Проверяем разрешение на доступ к тесту
        self.check_object_permissions(request, step)

        # Проверяем, есть ли незавершенные попытки
        active_attempt = UserTestAttempt.objects.filter(
            user=request.user,
            test=test,
            completed_at__isnull=True
        ).first()

        if active_attempt:
            serializer = self.get_serializer(active_attempt)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Проверяем ограничение на количество попыток
        enhanced_settings = EnhancedTestSettings.objects.filter(
            test=test).first()
        if enhanced_settings and enhanced_settings.max_attempts > 0:
            attempt_count = UserTestAttempt.objects.filter(
                user=request.user,
                test=test,
                completed_at__isnull=False
            ).count()

            if attempt_count >= enhanced_settings.max_attempts:
                return Response(
                    {"error": "Превышено максимальное количество попыток"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Создаем новую попытку
        attempt = UserTestAttempt.objects.create(
            user=request.user,
            test=test,
            started_at=timezone.now()
        )

        serializer = self.get_serializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubmitEnhancedTestView(generics.GenericAPIView):
    """
    Представление для отправки ответов на расширенный тест
    """
    serializer_class = TestSubmitRequestSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        test_id = serializer.validated_data['test_id']
        test = get_object_or_404(LMSTest, pk=test_id)
        step = test.step

        # Проверяем разрешение на доступ к тесту
        self.check_object_permissions(request, step)

        # Получаем активную попытку
        attempt_id = serializer.validated_data.get('attempt_id')
        if attempt_id:
            attempt = get_object_or_404(
                UserTestAttempt,
                pk=attempt_id,
                user=request.user,
                test=test,
                completed_at__isnull=True
            )
        else:
            attempt = UserTestAttempt.objects.filter(
                user=request.user,
                test=test,
                completed_at__isnull=True
            ).first()

            if not attempt:
                # Создаем новую попытку, если нет активной
                attempt = UserTestAttempt.objects.create(
                    user=request.user,
                    test=test,
                    started_at=timezone.now()
                )

        # Обновляем время, затраченное на тест
        time_spent = serializer.validated_data.get('time_spent_seconds')
        if time_spent:
            attempt.time_spent_seconds = time_spent

        # Обрабатываем ответы и рассчитываем оценку
        answers = serializer.validated_data['answers']
        score = 0
        total_questions = 0

        for answer_data in answers:
            # Обрабатываем разные типы вопросов
            if 'question_id' in answer_data and 'answer_text' in answer_data:
                # Открытый вопрос
                question = get_object_or_404(
                    EnhancedLMSQuestion, pk=answer_data['question_id'])
                answer_text = answer_data['answer_text']

                # Проверяем соответствие правильным ответам
                correct_options = OpenAnswerOption.objects.filter(
                    question=question)
                is_correct = False

                for option in correct_options:
                    if option.match_exact:
                        # Проверка на точное совпадение
                        if option.is_case_sensitive:
                            is_correct = (answer_text == option.text)
                        else:
                            is_correct = (answer_text.lower() ==
                                          option.text.lower())
                    else:
                        # Проверка на вхождение
                        if option.is_case_sensitive:
                            is_correct = (option.text in answer_text)
                        else:
                            is_correct = (option.text.lower()
                                          in answer_text.lower())

                    if is_correct:
                        break

                # Сохраняем ответ пользователя
                UserOpenAnswer.objects.update_or_create(
                    user=request.user,
                    question=question,
                    attempt=attempt,
                    defaults={
                        'answer_text': answer_text,
                        'is_correct': is_correct,
                        'answered_at': timezone.now()
                    }
                )

                if is_correct:
                    score += 1

            # Стандартные вопросы с вариантами
            elif 'question_id' in answer_data and 'selected_option_ids' in answer_data:
                question = get_object_or_404(
                    EnhancedLMSQuestion, pk=answer_data['question_id'])
                selected_option_ids = answer_data['selected_option_ids']

                # Логика для разных типов вопросов
                if question.question_type == 'single_choice':
                    # Выбор одного варианта
                    if len(selected_option_ids) == 1:
                        # Создать стандартный LMSUserAnswer
                        option_id = selected_option_ids[0]
                        from .lms_models import LMSOption, LMSUserAnswer
                        option = get_object_or_404(
                            LMSOption, pk=option_id, question__test=test)

                        LMSUserAnswer.objects.update_or_create(
                            user=request.user,
                            question=option.question,
                            defaults={
                                'selected_option': option,
                                'answered_at': timezone.now()
                            }
                        )

                        if option.is_correct:
                            score += 1

                elif question.question_type == 'multiple_choice':
                    # Множественный выбор - все ответы должны быть правильными
                    from .lms_models import LMSOption
                    options = LMSOption.objects.filter(
                        pk__in=selected_option_ids, question__test=test)

                    # Проверяем что все выбранные опции правильные и все правильные опции выбраны
                    correct_options = LMSOption.objects.filter(
                        question__id=question.id, is_correct=True)
                    selected_correct = options.filter(is_correct=True).count()

                    if (selected_correct == options.count() and
                            selected_correct == correct_options.count()):
                        score += 1

                    # Создаем записи для каждого выбранного варианта
                    for option in options:
                        from .lms_models import LMSUserAnswer
                        LMSUserAnswer.objects.update_or_create(
                            user=request.user,
                            question=option.question,
                            defaults={
                                'selected_option': option,
                                'answered_at': timezone.now()
                            }
                        )

            total_questions += 1

        # Завершаем попытку и рассчитываем результат
        attempt.score = score
        attempt.max_score = total_questions
        attempt.completed_at = timezone.now()

        # Определяем успешность прохождения теста
        enhanced_settings = EnhancedTestSettings.objects.filter(
            test=test).first()
        passing_score_percent = 70  # По умолчанию

        if enhanced_settings:
            passing_score_percent = enhanced_settings.passing_score_percent

        # Вычисляем процент правильных ответов
        if total_questions > 0:
            score_percent = (score / total_questions) * 100
            attempt.is_passed = score_percent >= passing_score_percent
        else:
            attempt.is_passed = False

        attempt.save()

        # Обновляем или создаем запись в LMSUserTestResult для совместимости
        from .lms_models import LMSUserTestResult
        LMSUserTestResult.objects.update_or_create(
            user=request.user,
            test=test,
            defaults={
                'is_passed': attempt.is_passed,
                'score': score,
                'max_score': total_questions,
                'completed_at': timezone.now(),
                'step': step
            }
        )

        # Если тест пройден успешно, обновляем прогресс шага
        if attempt.is_passed:
            UserStepProgress.objects.update_or_create(
                user=request.user,
                step=step,
                defaults={
                    'status': UserStepProgress.ProgressStatus.DONE,
                    'completed_at': timezone.now(),
                    'actual_completed_at': timezone.now()
                }
            )

        return Response({
            'is_passed': attempt.is_passed,
            'score': score,
            'max_score': total_questions,
            'score_percent': (score / total_questions * 100) if total_questions > 0 else 0,
            'passing_score_percent': passing_score_percent,
            'attempt_id': attempt.id
        }, status=status.HTTP_200_OK)
