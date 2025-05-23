from django.utils import timezone
from django.db.models import Q
from django.core.exceptions import ObjectDoesNotExist
from .client_models import ClientAIInsight
from onboarding.models import UserStepProgress, OnboardingStep, UserOnboardingAssignment
from onboarding.feedback_models import StepFeedback


class ClientAISuggestionService:
    """
    Сервисный класс для генерации подсказок для пользователей в процессе онбординга
    """

    @staticmethod
    def generate_suggestion(user_id, step_id, assignment_id=None):
        """
        Генерирует подсказку для пользователя по шагу

        Args:
            user_id: ID пользователя
            step_id: ID шага
            assignment_id: Опциональный ID назначения (если не указан, будет найден автоматически)

        Returns:
            ClientAIInsight: Созданный или существующий объект подсказки
        """
        # Проверяем, существует ли уже подсказка для этого шага и пользователя
        try:
            if assignment_id:
                insight = ClientAIInsight.objects.get(
                    user_id=user_id,
                    step_id=step_id,
                    assignment_id=assignment_id,
                    dismissed=False
                )
                return insight
            else:
                # Ищем назначение, если оно не указано
                insight = ClientAIInsight.objects.get(
                    user_id=user_id,
                    step_id=step_id,
                    dismissed=False
                )
                return insight
        except ObjectDoesNotExist:
            pass

        # Определяем назначение, если оно не указано
        if not assignment_id:
            try:
                step = OnboardingStep.objects.get(id=step_id)
                assignment = UserOnboardingAssignment.objects.get(
                    user_id=user_id,
                    program=step.program,
                    status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
                )
                assignment_id = assignment.id
            except (OnboardingStep.DoesNotExist, UserOnboardingAssignment.DoesNotExist):
                return None

        # Получаем данные, необходимые для генерации подсказки
        hint_text = ClientAISuggestionService._create_hint_text(
            user_id, step_id, assignment_id)

        if not hint_text:
            return None

        # Создаем новую подсказку
        insight = ClientAIInsight.objects.create(
            user_id=user_id,
            step_id=step_id,
            assignment_id=assignment_id,
            hint_text=hint_text,
            generated_at=timezone.now()
        )

        return insight

    @staticmethod
    def dismiss_suggestion(insight_id):
        """
        Отмечает подсказку как скрытую

        Args:
            insight_id: ID подсказки

        Returns:
            bool: True если успешно, False если подсказка не найдена
        """
        try:
            insight = ClientAIInsight.objects.get(id=insight_id)
            insight.dismissed = True
            insight.save()
            return True
        except ClientAIInsight.DoesNotExist:
            return False

    @staticmethod
    def get_active_suggestions(user_id):
        """
        Возвращает все активные (не скрытые) подсказки для пользователя

        Args:
            user_id: ID пользователя

        Returns:
            QuerySet: Набор активных подсказок
        """
        return ClientAIInsight.objects.filter(
            user_id=user_id,
            dismissed=False
        ).order_by('-generated_at')

    @staticmethod
    def _create_hint_text(user_id, step_id, assignment_id):
        """
        Создает текст подсказки на основе анализа шага и действий пользователя
        Правила генерации подсказок (rule-based логика)

        Args:
            user_id: ID пользователя
            step_id: ID шага
            assignment_id: ID назначения

        Returns:
            str: Текст подсказки или None, если подсказка не требуется
        """
        # Получаем шаг
        try:
            step = OnboardingStep.objects.get(id=step_id)
            assignment = UserOnboardingAssignment.objects.get(id=assignment_id)
            step_progress = UserStepProgress.objects.get(
                user_id=user_id,
                step_id=step_id
            )
        except (OnboardingStep.DoesNotExist, UserOnboardingAssignment.DoesNotExist, UserStepProgress.DoesNotExist):
            return None

        hints = []

        # Проверяем наличие видео в шаге
        if step.video_url:
            hints.append(
                "Шаг включает видео — рекомендуем сначала просмотреть его")

        # Проверяем близость дедлайна
        if step_progress.planned_date_end:
            days_left = (step_progress.planned_date_end.date() -
                         timezone.now().date()).days
            if days_left <= 1:
                hints.append(
                    f"До дедлайна {days_left} {'день' if days_left == 1 else 'дней'} — успейте завершить шаг")
            elif days_left <= 3:
                hints.append(
                    f"До дедлайна {days_left} дня — рекомендуем не откладывать выполнение")

        # Проверяем предыдущий негативный опыт пользователя в похожих шагах
        negative_feedbacks = StepFeedback.objects.filter(
            assignment__user_id=user_id,
            step__step_type=step.step_type,
            sentiment_score__lt=-0.1
        ).exclude(step_id=step_id)

        if negative_feedbacks.exists():
            hints.append(
                "Вы оставили негативный фидбэк по похожему шагу — возможно, стоит уточнить детали у менеджера")

        # Проверяем, есть ли у шага сложное описание или документация
        if len(step.description) > 500:
            hints.append(
                "Этот шаг имеет подробное описание — уделите время для внимательного изучения материалов")

        # Если есть материалы для чтения
        if step.materials and len(step.materials) > 0:
            hints.append(
                "Для выполнения шага рекомендуем ознакомиться со всеми прикрепленными материалами")

        # Не возвращаем подсказку, если их нет или шаг уже завершен
        if not hints or step_progress.status == 'done':
            return None

        # Выбираем наиболее релевантную подсказку (в простой реализации - первую)
        # В будущем можно реализовать более сложную логику приоритезации
        return hints[0]
