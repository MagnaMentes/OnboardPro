from django.db.models import Count, Avg, F, Q, Case, When, IntegerField, ExpressionWrapper
from django.db.models.functions import TruncDay
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, views
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from users.permissions import IsAdminOrHR
from .models import UserOnboardingAssignment, UserStepProgress
from .feedback_models import FeedbackMood, StepFeedback
from .lms_models import LMSUserTestResult
from users.models import User


@extend_schema(
    tags=["Analytics"],
    summary="Получение общей сводки по онбордингу",
    description="API для получения общей сводки по онбордингу. Включает количество сотрудников на онбординге, "
                "количество завершённых назначений, средний процент прогресса, статистику по фидбеку и тестам.",
    responses={
        200: OpenApiResponse(description="Общая сводка по онбордингу"),
    }
)
class AnalyticsSummaryView(views.APIView):
    """
    API для получения общей сводки по онбордингу.

    Метрики включают:
    - Количество сотрудников на онбординге
    - Количество завершённых назначений
    - Средний процент прогресса по шагам
    - Количество оставленного фидбека
    - Среднее настроение за последние 7 дней
    - Количество пройденных тестов и их успешность
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request, format=None):
        # Дата 7 дней назад для расчета среднего настроения
        seven_days_ago = timezone.now() - timedelta(days=7)

        # Получаем общие метрики по назначениям
        total_assignments = UserOnboardingAssignment.objects.count()
        active_assignments = UserOnboardingAssignment.objects.filter(
            status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
        ).count()
        completed_assignments = UserOnboardingAssignment.objects.filter(
            status=UserOnboardingAssignment.AssignmentStatus.COMPLETED
        ).count()

        # Расчет среднего прогресса
        # Сначала для каждого назначения рассчитываем процент завершенных шагов
        all_step_progress = UserStepProgress.objects.all()
        completed_steps = all_step_progress.filter(
            status=UserStepProgress.ProgressStatus.DONE
        ).count()

        # Если нет шагов, устанавливаем средний прогресс в 0
        average_progress = 0
        if all_step_progress.count() > 0:
            average_progress = (
                completed_steps / all_step_progress.count()) * 100

        # Статистика по отзывам
        total_feedback_moods = FeedbackMood.objects.count()
        total_step_feedback = StepFeedback.objects.count()

        # Среднее настроение за последние 7 дней
        # Преобразуем текстовые значения настроения в числовые для расчета среднего
        mood_value_map = {
            FeedbackMood.MoodValue.GREAT: 5,
            FeedbackMood.MoodValue.GOOD: 4,
            FeedbackMood.MoodValue.NEUTRAL: 3,
            FeedbackMood.MoodValue.BAD: 2,
            FeedbackMood.MoodValue.TERRIBLE: 1,
        }

        recent_moods = FeedbackMood.objects.filter(
            created_at__gte=seven_days_ago)
        avg_mood_value = 0

        if recent_moods.exists():
            # Создаем выражение для числового значения настроения
            mood_case = Case(
                *[When(value=k, then=v) for k, v in mood_value_map.items()],
                output_field=IntegerField()
            )

            # Вычисляем среднее значение
            avg_mood = recent_moods.annotate(
                numeric_value=mood_case
            ).aggregate(avg_value=Avg('numeric_value'))

            avg_mood_value = avg_mood['avg_value'] or 0

        # Статистика по тестам
        total_tests_taken = LMSUserTestResult.objects.count()
        passed_tests = LMSUserTestResult.objects.filter(is_passed=True).count()

        test_success_rate = 0
        if total_tests_taken > 0:
            test_success_rate = (passed_tests / total_tests_taken) * 100

        return Response({
            'active_onboarding_count': active_assignments,
            'completed_assignments_count': completed_assignments,
            'total_assignments_count': total_assignments,
            'average_progress_percentage': round(average_progress, 2),
            'feedback': {
                'total_mood_count': total_feedback_moods,
                'total_step_feedback_count': total_step_feedback,
                'average_mood_last_7_days': round(avg_mood_value, 2)
            },
            'tests': {
                'total_taken': total_tests_taken,
                'passed': passed_tests,
                'success_rate_percentage': round(test_success_rate, 2)
            }
        })


@extend_schema(
    tags=["Analytics"],
    summary="Получение таблицы назначений с прогрессом",
    description="API для получения таблицы всех назначений с прогрессом в процентах. "
                "Включает ФИО, должность, программу, статус, процент прогресса и дату начала.",
    responses={
        200: OpenApiResponse(description="Таблица назначений с прогрессом"),
    }
)
class AssignmentsAnalyticsView(views.APIView):
    """
    API для получения таблицы всех назначений с прогрессом в процентах.

    Возвращает информацию о каждом назначении:
    - ФИО сотрудника
    - Должность
    - Программа
    - Статус
    - Процент прогресса
    - Дата начала
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request, format=None):
        # Получаем все назначения
        assignments = UserOnboardingAssignment.objects.all()

        result = []

        for assignment in assignments:
            # Для каждого назначения рассчитываем процент прогресса
            user = assignment.user
            program = assignment.program

            # Получаем шаги программы
            program_steps = program.steps.all()
            total_steps = program_steps.count()

            # Если нет шагов, устанавливаем прогресс в 0
            progress_percentage = 0

            if total_steps > 0:
                # Получаем завершенные шаги пользователя в этой программе
                completed_steps = UserStepProgress.objects.filter(
                    user=user,
                    step__program=program,
                    status=UserStepProgress.ProgressStatus.DONE
                ).count()

                progress_percentage = (completed_steps / total_steps) * 100

            result.append({
                'id': assignment.id,
                'full_name': user.get_full_name(),
                'position': user.position,
                'program': program.name,
                'status': assignment.get_status_display(),
                'progress_percentage': round(progress_percentage, 2),
                'assigned_at': assignment.assigned_at
            })

        return Response(result)


@extend_schema(
    tags=["Analytics"],
    summary="Получение сводки по настроениям пользователей",
    description="API для получения сводки по настроениям пользователей за последние 14 дней. "
                "Группирует отзывы по дням для построения графика.",
    responses={
        200: OpenApiResponse(description="Сводка по настроениям пользователей"),
    }
)
class FeedbackSummaryView(views.APIView):
    """
    API для получения сводки по настроениям пользователей за последние 14 дней.

    Группирует отзывы по дням и возвращает данные в формате,
    удобном для построения графика.
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request, format=None):
        # Дата 14 дней назад
        fourteen_days_ago = timezone.now() - timedelta(days=14)

        # Получаем настроения за последние 14 дней, группируя по дням
        moods_by_day = FeedbackMood.objects.filter(
            created_at__gte=fourteen_days_ago
        ).annotate(
            day=TruncDay('created_at')
        ).values('day').annotate(
            great_count=Count('id', filter=Q(
                value=FeedbackMood.MoodValue.GREAT)),
            good_count=Count('id', filter=Q(
                value=FeedbackMood.MoodValue.GOOD)),
            neutral_count=Count('id', filter=Q(
                value=FeedbackMood.MoodValue.NEUTRAL)),
            bad_count=Count('id', filter=Q(value=FeedbackMood.MoodValue.BAD)),
            terrible_count=Count('id', filter=Q(
                value=FeedbackMood.MoodValue.TERRIBLE)),
            total_count=Count('id')
        ).order_by('day')

        return Response({
            'days': [item['day'].strftime('%Y-%m-%d') for item in moods_by_day],
            'great': [item['great_count'] for item in moods_by_day],
            'good': [item['good_count'] for item in moods_by_day],
            'neutral': [item['neutral_count'] for item in moods_by_day],
            'bad': [item['bad_count'] for item in moods_by_day],
            'terrible': [item['terrible_count'] for item in moods_by_day],
            'total': [item['total_count'] for item in moods_by_day],
        })
