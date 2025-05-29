from rest_framework import generics, permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count, Avg, F, Q, Sum
from django.utils import timezone
from .training_models import (
    TrainingInsight, UserLearningMetric,
    DepartmentLearningMetric, QuestionDifficultyMetric
)
from .training_serializers import (
    TrainingInsightSerializer, UserLearningMetricSerializer,
    DepartmentLearningMetricSerializer, QuestionDifficultyMetricSerializer,
    UserLearningOverviewSerializer, DepartmentTrainingOverviewSerializer
)
from .training_insights_service import TrainingInsightsService
from departments.models import Department
from onboarding.lms_models import LMSUserTestResult
from onboarding.models import OnboardingStep, UserOnboardingAssignment
from users.permissions import IsAdminOrHR
from users.models import User


class TrainingInsightViewSet(viewsets.ModelViewSet):
    """
    Набор представлений для работы с AI-инсайтами по обучению
    """
    queryset = TrainingInsight.objects.filter(is_dismissed=False)
    serializer_class = TrainingInsightSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """
        Отметить инсайт как обработанный
        """
        insight = self.get_object()
        insight.is_dismissed = True
        insight.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['post'])
    def regenerate(self, request):
        """
        Запустить повторный анализ и создание инсайтов
        """
        count = TrainingInsightsService.run_all_analysis()
        return Response({'status': 'success', 'created_insights': count})

    def get_queryset(self):
        """
        Фильтрация инсайтов по различным параметрам
        """
        queryset = TrainingInsight.objects.filter(is_dismissed=False)

        # Фильтрация по типу инсайта
        insight_type = self.request.query_params.get('insight_type')
        if insight_type:
            queryset = queryset.filter(insight_type=insight_type)

        # Фильтрация по степени важности
        min_severity = self.request.query_params.get('min_severity')
        if min_severity:
            queryset = queryset.filter(severity__gte=float(min_severity))

        # Фильтрация по департаменту
        department_id = self.request.query_params.get('department_id')
        if department_id:
            queryset = queryset.filter(department_id=department_id)

        # Фильтрация по дате создания
        days_ago = self.request.query_params.get('days_ago')
        if days_ago:
            from datetime import timedelta
            date_threshold = timezone.now() - timedelta(days=int(days_ago))
            queryset = queryset.filter(created_at__gte=date_threshold)

        # Сортировка по умолчанию
        return queryset.order_by('-severity', '-created_at')


class UserLearningMetricView(generics.RetrieveAPIView):
    """
    Представление для получения метрик обучения пользователя
    """
    serializer_class = UserLearningOverviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get_object(self):
        user_id = self.kwargs.get('user_id')
        user = get_object_or_404(User, pk=user_id)

        # Получаем все результаты тестов пользователя
        test_results = LMSUserTestResult.objects.filter(user=user)

        # Рассчитываем общие метрики
        total_tests_completed = test_results.count()
        total_tests_passed = test_results.filter(is_passed=True).count()

        avg_score = 0
        if test_results.exists():
            avg_score = test_results.aggregate(
                avg=Sum('score') * 100.0 / Sum('max_score')
            )['avg'] or 0

        # Получаем общее время, затраченное на тесты
        from onboarding.lms_models_v2 import UserTestAttempt
        total_seconds = UserTestAttempt.objects.filter(
            user=user,
            completed_at__isnull=False
        ).aggregate(
            total=Sum('time_spent_seconds')
        )['total'] or 0

        total_minutes = total_seconds // 60

        # Получаем метрики обучения пользователя
        user_metrics = UserLearningMetric.objects.filter(
            user=user,
            step__isnull=False  # Исключаем общие метрики
        ).order_by('-calculated_at')[:10]  # Берем последние 10 метрик

        # Находим области, в которых пользователь силен/слаб
        step_metrics = []

        for metric in user_metrics:
            if metric.step and metric.correct_answer_rate > 0:
                step_metrics.append({
                    'step_name': metric.step.name,
                    'score': metric.correct_answer_rate,
                    'speed': metric.learning_speed_index
                })

        strongest_area = "Не определено"
        weakest_area = "Не определено"

        if step_metrics:
            # Сортируем по оценке
            sorted_by_score = sorted(
                step_metrics, key=lambda x: x['score'], reverse=True)
            strongest_area = sorted_by_score[0]['step_name'] if sorted_by_score else "Не определено"
            weakest_area = sorted_by_score[-1]['step_name'] if len(
                sorted_by_score) > 1 else "Не определено"

        # Вычисляем процентиль скорости обучения
        learning_speed_percentile = 50  # По умолчанию

        overall_metric = UserLearningMetric.objects.filter(
            user=user,
            step__isnull=True  # Общая метрика
        ).order_by('-calculated_at').first()

        if overall_metric and overall_metric.learning_speed_index > 0:
            # Вычисляем процентиль на основе общего индекса скорости
            learning_speed_percentile = overall_metric.learning_speed_index * 100

        # Рассчитываем общий процент завершения обучения
        completion_rate = 0
        if total_tests_completed > 0:
            completion_rate = total_tests_passed / total_tests_completed

        # Формируем ответ
        return {
            'total_tests_completed': total_tests_completed,
            'total_tests_passed': total_tests_passed,
            'avg_score_percent': avg_score,
            'total_time_spent_minutes': total_minutes,
            'learning_speed_percentile': learning_speed_percentile,
            'strongest_area': strongest_area,
            'weakest_area': weakest_area,
            'completion_rate': completion_rate,
            'user_metrics': user_metrics
        }


class DepartmentTrainingOverviewView(generics.RetrieveAPIView):
    """
    Представление для получения обзора обучения по департаменту с AI-инсайтами
    """
    serializer_class = DepartmentTrainingOverviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get_object(self):
        department_id = self.kwargs.get('department_id')
        department = get_object_or_404(Department, pk=department_id)

        # Получаем последнюю метрику для департамента
        metrics = DepartmentLearningMetric.objects.filter(
            department=department
        ).order_by('-calculated_at').first()

        # Если метрик нет, создаем заглушку
        if not metrics:
            metrics = DepartmentLearningMetric(
                department=department,
                user_count=0,
                avg_test_completion_rate=0,
                avg_correct_answer_rate=0,
                calculated_at=timezone.now()
            )

        # Получаем пользователей из департамента
        users = User.objects.filter(profile__department=department)
        active_users = users.filter(
            onboarding_assignments__status='active'
        ).distinct().count()

        # Получаем топ-5 инсайтов для департамента
        top_insights = TrainingInsight.objects.filter(
            department=department,
            is_dismissed=False
        ).order_by('-severity')[:5]

        # Получаем топ-5 лучших и худших пользователей по скорости обучения
        user_metrics = UserLearningMetric.objects.filter(
            user__profile__department=department,
            step__isnull=True  # Общие метрики
        ).order_by('-learning_speed_index')

        best_performing = user_metrics[:5]
        struggling_users = user_metrics.order_by('learning_speed_index')[:5]

        # Формируем ответ
        return {
            'department': department,
            'metrics': metrics,
            'total_users': users.count(),
            'active_users': active_users,
            'avg_completion_rate': metrics.avg_test_completion_rate,
            'avg_score': metrics.avg_correct_answer_rate,
            'top_insights': top_insights,
            'best_performing_users': best_performing,
            'struggling_users': struggling_users
        }


class QuestionDifficultyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Набор представлений только для чтения метрик сложности вопросов
    """
    queryset = QuestionDifficultyMetric.objects.all().order_by('-difficulty_score')
    serializer_class = QuestionDifficultyMetricSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get_queryset(self):
        """
        Фильтрация метрик по различным параметрам
        """
        queryset = QuestionDifficultyMetric.objects.all()

        # Фильтрация по тесту
        test_id = self.request.query_params.get('test_id')
        if test_id:
            queryset = queryset.filter(test_id=test_id)

        # Фильтрация по минимальной сложности
        min_difficulty = self.request.query_params.get('min_difficulty')
        if min_difficulty:
            queryset = queryset.filter(
                difficulty_score__gte=float(min_difficulty))

        # Сортировка по умолчанию - от наиболее сложных к менее сложным
        return queryset.order_by('-difficulty_score')


class DepartmentComparisonView(generics.ListAPIView):
    """
    Представление для сравнения метрик обучения между департаментами
    """
    serializer_class = DepartmentLearningMetricSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get_queryset(self):
        """
        Получение последних метрик для всех активных департаментов
        """
        # Получаем все активные департаменты
        departments = Department.objects.filter(is_active=True)

        latest_metrics = []

        # Для каждого департамента получаем последнюю метрику
        for department in departments:
            metric = DepartmentLearningMetric.objects.filter(
                department=department
            ).order_by('-calculated_at').first()

            if metric:
                latest_metrics.append(metric)

        # Сортируем от лучших к худшим по среднему проценту правильных ответов
        return sorted(
            latest_metrics,
            key=lambda x: x.avg_correct_answer_rate,
            reverse=True
        )


class TrainingCommandCenter(generics.GenericAPIView):
    """
    Представление для командного центра обучения - агрегированная информация
    по всей системе обучения
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get(self, request, *args, **kwargs):
        # Получаем общую статистику по тестам
        total_tests = LMSUserTestResult.objects.count()
        passed_tests = LMSUserTestResult.objects.filter(is_passed=True).count()
        passing_rate = passed_tests / total_tests if total_tests > 0 else 0

        # Получаем количество активных тестов и модулей
        from onboarding.lms_models import LMSTest
        active_tests = LMSTest.objects.count()

        from onboarding.lms_models_v2 import LearningModule
        active_modules = LearningModule.objects.count()

        # Получаем статистику по инсайтам
        total_insights = TrainingInsight.objects.count()
        active_insights = TrainingInsight.objects.filter(
            is_dismissed=False).count()
        critical_insights = TrainingInsight.objects.filter(
            is_dismissed=False,
            severity__gte=0.7
        ).count()

        # Получаем статистику по пользователям с трудностями
        struggling_users_count = TrainingInsight.objects.filter(
            insight_type='struggling_user',
            is_dismissed=False
        ).values('user').distinct().count()

        # Получаем топ-3 самых проблемных шага
        problematic_steps = TrainingInsight.objects.filter(
            insight_type__in=['difficult_step', 'problematic_test'],
            is_dismissed=False
        ).values('step__name').annotate(
            count=Count('id'),
            avg_severity=Avg('severity')
        ).order_by('-count', '-avg_severity')[:3]

        # Формируем ответ
        return Response({
            'statistics': {
                'total_tests_taken': total_tests,
                'passing_rate': passing_rate,
                'active_tests': active_tests,
                'active_modules': active_modules,
                'total_insights': total_insights,
                'active_insights': active_insights,
                'critical_insights': critical_insights,
                'struggling_users': struggling_users_count
            },
            'problematic_steps': problematic_steps,
            'last_updated': timezone.now()
        })


class RunTrainingAnalysisView(generics.GenericAPIView):
    """
    Представление для запуска анализа данных обучения
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def post(self, request, *args, **kwargs):
        # Запускаем все методы анализа
        insights_count = TrainingInsightsService.run_all_analysis()

        # Обновляем метрики для всех пользователей с активными заданиями
        users_with_assignments = User.objects.filter(
            onboarding_assignments__status='active'
        ).distinct()

        users_updated = 0
        for user in users_with_assignments:
            TrainingInsightsService.calculate_user_metrics(user)
            users_updated += 1

        # Обновляем индексы скорости обучения
        TrainingInsightsService.calculate_learning_speed_indices()

        # Возвращаем результат
        return Response({
            'status': 'success',
            'insights_created': insights_count,
            'users_metrics_updated': users_updated,
            'completed_at': timezone.now()
        })
