import datetime
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from django.utils import timezone
from django.db.models import Avg, Count, F, Q, Sum, DurationField
from django.db.models.functions import TruncDay, Extract
from django.contrib.auth import get_user_model
from django.conf import settings
import pytz

from departments.models import Department
from onboarding.models import (
    UserOnboardingAssignment,
    UserStepProgress,
    OnboardingProgram,
    OnboardingStep
)
from .models import (
    OnboardingProgressSnapshot,
    OnboardingRiskPrediction,
    OnboardingAnomaly,
    OnboardingDepartmentSummary
)


User = get_user_model()


class OnboardingProgressAggregatorService:
    """
    Сервис для агрегации метрик по онбордингу пользователей и департаментов
    """

    @classmethod
    def generate_user_snapshots(cls, user=None, department=None, all_users=False):
        """
        Создает снимки прогресса онбординга для заданного пользователя,
        департамента или всех пользователей
        """
        queryset = UserOnboardingAssignment.objects.filter(
            status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
        ).select_related('user', 'program', 'user__department')

        if user and not all_users:
            queryset = queryset.filter(user=user)
        elif department and not all_users:
            queryset = queryset.filter(user__department=department)

        for assignment in queryset:
            # Получаем статистику по шагам
            steps = UserStepProgress.objects.filter(
                user=assignment.user,
                step__program=assignment.program
            ).select_related('step')

            total_steps = steps.count()
            if total_steps == 0:
                continue

            completed_steps = steps.filter(
                status=UserStepProgress.ProgressStatus.DONE
            ).count()

            in_progress_steps = steps.filter(
                status=UserStepProgress.ProgressStatus.IN_PROGRESS
            ).count()

            not_started_steps = steps.filter(
                status=UserStepProgress.ProgressStatus.NOT_STARTED
            ).count()

            # Определяем просроченные шаги
            now = timezone.now()
            overdue_steps = steps.filter(
                Q(planned_date_end__lt=now) &
                ~Q(status=UserStepProgress.ProgressStatus.DONE)
            ).count()

            # Вычисляем среднее время прохождения шага
            completed_steps_with_times = steps.filter(
                status=UserStepProgress.ProgressStatus.DONE,
                actual_completed_at__isnull=False,
                planned_date_start__isnull=False
            )

            avg_completion_time = None
            if completed_steps_with_times.exists():
                completion_times = []
                for step in completed_steps_with_times:
                    if step.actual_completed_at and step.planned_date_start:
                        duration = step.actual_completed_at - step.planned_date_start
                        completion_times.append(duration)

                if completion_times:
                    avg_completion_time = sum(
                        completion_times, datetime.timedelta()) / len(completion_times)

            # Вычисляем время последней активности
            last_activity = steps.filter(
                ~Q(status=UserStepProgress.ProgressStatus.NOT_STARTED)
            ).order_by('-actual_completed_at', '-completed_at').first()

            last_activity_time = None
            if last_activity:
                if last_activity.actual_completed_at:
                    last_activity_time = last_activity.actual_completed_at
                elif last_activity.completed_at:
                    last_activity_time = last_activity.completed_at

            # Вычисляем процент прогресса
            completion_percentage = (
                completed_steps / total_steps) * 100.0 if total_steps > 0 else 0.0

            # Создаем снимок
            OnboardingProgressSnapshot.objects.create(
                user=assignment.user,
                assignment=assignment,
                department=assignment.user.department,
                completion_percentage=completion_percentage,
                steps_total=total_steps,
                steps_completed=completed_steps,
                steps_in_progress=in_progress_steps,
                steps_not_started=not_started_steps,
                steps_overdue=overdue_steps,
                avg_step_completion_time=avg_completion_time,
                last_activity_time=last_activity_time
            )

    @classmethod
    def generate_department_summaries(cls):
        """
        Создает сводку прогресса онбординга по департаментам
        """
        departments = Department.objects.filter(is_active=True)

        for department in departments:
            # Количество активных онбордингов
            active_assignments = UserOnboardingAssignment.objects.filter(
                user__department=department,
                status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
            ).count()

            # Количество завершенных онбордингов
            completed_assignments = UserOnboardingAssignment.objects.filter(
                user__department=department,
                status=UserOnboardingAssignment.AssignmentStatus.COMPLETED
            ).count()

            # Среднее время прохождения онбординга
            completed_with_dates = UserOnboardingAssignment.objects.filter(
                user__department=department,
                status=UserOnboardingAssignment.AssignmentStatus.COMPLETED
            ).annotate(
                completion_time=F('completed_at') - F('assigned_at')
            )

            avg_completion_time = None
            if completed_with_dates.exists():
                completion_times = [
                    a.completion_time for a in completed_with_dates if a.completion_time]
                if completion_times:
                    avg_completion_time = sum(
                        completion_times, datetime.timedelta()) / len(completion_times)

            # Средний процент прогресса
            latest_snapshots = OnboardingProgressSnapshot.objects.filter(
                department=department
            ).order_by('user', '-snapshot_date').distinct('user')

            avg_completion_percentage = latest_snapshots.aggregate(
                avg=Avg('completion_percentage')
            )['avg'] or 0.0

            # Вычисляем фактор риска
            risk_factor = cls._calculate_department_risk_factor(department)

            # Определяем наиболее частые препятствия
            bottlenecks = cls._identify_department_bottlenecks(department)

            # Создаем сводку по департаменту
            OnboardingDepartmentSummary.objects.create(
                department=department,
                active_onboardings=active_assignments,
                completed_onboardings=completed_assignments,
                avg_completion_time=avg_completion_time,
                avg_completion_percentage=avg_completion_percentage,
                risk_factor=risk_factor,
                most_common_bottlenecks=bottlenecks
            )

    @staticmethod
    def _calculate_department_risk_factor(department):
        """
        Вычисляет фактор риска для департамента на основе различных метрик
        """
        # Процент просроченных шагов
        all_steps = UserStepProgress.objects.filter(
            user__department=department
        ).count()

        if all_steps == 0:
            return 0.0

        overdue_steps = UserStepProgress.objects.filter(
            user__department=department,
            planned_date_end__lt=timezone.now(),
            status__in=[
                UserStepProgress.ProgressStatus.NOT_STARTED,
                UserStepProgress.ProgressStatus.IN_PROGRESS
            ]
        ).count()

        overdue_percentage = (
            overdue_steps / all_steps) if all_steps > 0 else 0

        # Аномалии за последние 30 дней
        recent_anomalies = OnboardingAnomaly.objects.filter(
            department=department,
            detected_at__gte=timezone.now() - datetime.timedelta(days=30)
        ).count()

        users_count = User.objects.filter(department=department).count()
        anomaly_factor = recent_anomalies / users_count if users_count > 0 else 0

        # Коэффициент прогресса (инвертированный - ниже процент, выше риск)
        progress_factor = 1.0 - (OnboardingProgressSnapshot.objects.filter(
            department=department
        ).order_by('user', '-snapshot_date').distinct('user').aggregate(
            avg=Avg('completion_percentage')
        )['avg'] or 0.0) / 100.0

        # Вычисляем итоговый фактор риска (взвешенное среднее)
        risk_factor = overdue_percentage * 0.4 + \
            anomaly_factor * 0.3 + progress_factor * 0.3

        # Нормализуем значение от 0 до 1
        return min(max(risk_factor, 0.0), 1.0)

    @staticmethod
    def _identify_department_bottlenecks(department):
        """
        Определяет наиболее частые проблемы в онбординге департамента
        """
        # Шаги с наибольшим количеством просрочек
        overdue_steps = UserStepProgress.objects.filter(
            user__department=department,
            planned_date_end__lt=timezone.now(),
            status__in=[
                UserStepProgress.ProgressStatus.NOT_STARTED,
                UserStepProgress.ProgressStatus.IN_PROGRESS
            ]
        ).values('step__name').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        # Шаги с наибольшим временем выполнения
        slow_steps = UserStepProgress.objects.filter(
            user__department=department,
            status=UserStepProgress.ProgressStatus.DONE,
            actual_completed_at__isnull=False,
            planned_date_start__isnull=False
        ).annotate(
            completion_time=F('actual_completed_at') - F('planned_date_start')
        ).order_by('-completion_time').values('step__name')[:5]

        # Наиболее частые типы аномалий
        common_anomalies = OnboardingAnomaly.objects.filter(
            department=department
        ).values('anomaly_type').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        bottlenecks = {
            'overdue_steps': list(overdue_steps),
            'slow_steps': [{
                'step_name': step['step__name']
            } for step in slow_steps],
            'common_anomalies': [{
                'type': anomaly['anomaly_type'],
                'count': anomaly['count']
            } for anomaly in common_anomalies]
        }

        return bottlenecks


class OnboardingRiskAnalyzerService:
    """
    Сервис для анализа рисков онбординга и предоставления прогнозов
    """

    @classmethod
    def analyze_user_risks(cls, user=None, department=None, all_users=False):
        """
        Анализирует риски онбординга для заданного пользователя, департамента или всех пользователей
        """
        queryset = UserOnboardingAssignment.objects.filter(
            status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
        ).select_related('user', 'program', 'user__department')

        if user and not all_users:
            queryset = queryset.filter(user=user)
        elif department and not all_users:
            queryset = queryset.filter(user__department=department)

        for assignment in queryset:
            # Анализ риска незавершения онбординга
            cls._analyze_completion_risk(assignment)

            # Анализ риска задержек
            cls._analyze_delay_risk(assignment)

            # Анализ риска низкой вовлеченности
            cls._analyze_engagement_risk(assignment)

            # Анализ риска недостаточного усвоения информации
            cls._analyze_knowledge_retention_risk(assignment)

    @classmethod
    def _analyze_completion_risk(cls, assignment):
        """
        Анализирует риск незавершения онбординга для заданного назначения
        """
        # Получаем данные о прогрессе
        progress_data = cls._get_user_progress_data(assignment)

        # Получаем историю снимков прогресса
        snapshots = OnboardingProgressSnapshot.objects.filter(
            assignment=assignment
        ).order_by('snapshot_date')

        # Базовый уровень риска
        base_risk = 0.1

        # Факторы, увеличивающие риск
        risk_factors = []

        # Фактор 1: Наличие просроченных шагов
        overdue_factor = min(
            progress_data['steps_overdue'] / max(progress_data['steps_total'], 1) * 0.5, 0.5)
        if overdue_factor > 0:
            risk_factors.append(('overdue_steps', overdue_factor))

        # Фактор 2: Низкая скорость прохождения шагов
        progress_rate = 0
        if len(snapshots) >= 2:
            first_snapshot = snapshots.first()
            last_snapshot = snapshots.last()
            days_diff = (last_snapshot.snapshot_date -
                         first_snapshot.snapshot_date).days
            progress_diff = last_snapshot.completion_percentage - \
                first_snapshot.completion_percentage

            if days_diff > 0:
                progress_rate = progress_diff / days_diff

                if progress_rate < 1.5:  # Менее 1.5% в день считается медленным
                    slow_progress_factor = max(
                        0, (1.5 - progress_rate) / 1.5 * 0.3)
                    risk_factors.append(
                        ('slow_progress', slow_progress_factor))

        # Фактор 3: Не было активности в течение длительного периода
        if progress_data['last_activity_time']:
            days_inactive = (timezone.now() -
                             progress_data['last_activity_time']).days
            if days_inactive > 3:
                inactivity_factor = min(days_inactive / 10 * 0.3, 0.3)
                risk_factors.append(('inactivity', inactivity_factor))
        else:
            risk_factors.append(('no_activity', 0.3))

        # Фактор 4: Высокий уровень аномалий
        anomalies = OnboardingAnomaly.objects.filter(
            assignment=assignment,
            resolved=False
        ).count()

        if anomalies > 0:
            anomaly_factor = min(anomalies * 0.1, 0.3)
            risk_factors.append(('anomalies', anomaly_factor))

        # Финальная вероятность риска
        probability = base_risk
        for _, factor_value in risk_factors:
            probability += factor_value

        # Нормализуем до диапазона [0, 1]
        probability = min(probability, 1.0)

        # Определяем серьезность риска
        severity = cls._determine_risk_severity(probability)

        # Сохраняем прогноз риска
        OnboardingRiskPrediction.objects.create(
            user=assignment.user,
            assignment=assignment,
            department=assignment.user.department,
            risk_type=OnboardingRiskPrediction.RiskType.COMPLETION_RISK,
            severity=severity,
            probability=probability,
            factors={factor_name: float(factor_value)
                     for factor_name, factor_value in risk_factors},
            estimated_impact="Риск незавершения онбординга может привести к снижению эффективности сотрудника "
            "и увеличить вероятность его скорого ухода из компании.",
            recommendation=cls._generate_completion_risk_recommendation(
                risk_factors, assignment)
        )

    @classmethod
    def _analyze_delay_risk(cls, assignment):
        """
        Анализирует риск задержек в онбординге для заданного назначения
        """
        # Получаем данные о прогрессе
        progress_data = cls._get_user_progress_data(assignment)

        # Получаем информацию о шагах
        steps = UserStepProgress.objects.filter(
            user=assignment.user,
            step__program=assignment.program
        ).select_related('step')

        # Базовый уровень риска
        base_risk = 0.05

        # Факторы, увеличивающие риск
        risk_factors = []

        # Фактор 1: Наличие просроченных шагов
        overdue_factor = min(
            progress_data['steps_overdue'] / max(progress_data['steps_total'], 1) * 0.4, 0.4)
        if overdue_factor > 0:
            risk_factors.append(('overdue_steps', overdue_factor))

        # Фактор 2: Наличие шагов в статусе "не начато" с приближающимися дедлайнами
        now = timezone.now()
        soon_due_steps = steps.filter(
            status=UserStepProgress.ProgressStatus.NOT_STARTED,
            planned_date_end__isnull=False
        ).annotate(
            days_to_deadline=Extract(F('planned_date_end') - now, 'day')
        ).filter(days_to_deadline__lte=3, days_to_deadline__gt=0)

        if soon_due_steps.exists():
            soon_due_factor = min(soon_due_steps.count() * 0.1, 0.3)
            risk_factors.append(('soon_due_steps', soon_due_factor))

        # Фактор 3: Среднее время выполнения шагов больше запланированного
        steps_with_times = steps.filter(
            status=UserStepProgress.ProgressStatus.DONE,
            actual_completed_at__isnull=False,
            planned_date_start__isnull=False,
            planned_date_end__isnull=False
        )

        delay_ratio = 0
        if steps_with_times.exists():
            delay_count = 0
            total_steps = 0

            for step in steps_with_times:
                total_steps += 1
                planned_duration = step.planned_date_end - step.planned_date_start
                actual_duration = step.actual_completed_at - step.planned_date_start

                if actual_duration > planned_duration:
                    delay_count += 1

            if total_steps > 0:
                delay_ratio = delay_count / total_steps
                if delay_ratio > 0.3:
                    delay_history_factor = min(delay_ratio * 0.4, 0.4)
                    risk_factors.append(
                        ('delay_history', delay_history_factor))

        # Финальная вероятность риска
        probability = base_risk
        for _, factor_value in risk_factors:
            probability += factor_value

        # Нормализуем до диапазона [0, 1]
        probability = min(probability, 1.0)

        # Определяем серьезность риска
        severity = cls._determine_risk_severity(probability)

        # Сохраняем прогноз риска
        OnboardingRiskPrediction.objects.create(
            user=assignment.user,
            assignment=assignment,
            department=assignment.user.department,
            risk_type=OnboardingRiskPrediction.RiskType.DELAY_RISK,
            severity=severity,
            probability=probability,
            factors={factor_name: float(factor_value)
                     for factor_name, factor_value in risk_factors},
            estimated_impact="Задержки в онбординге могут привести к сдвигу сроков вхождения сотрудника в "
            "полноценную работу и снизить эффективность команды.",
            recommendation=cls._generate_delay_risk_recommendation(
                risk_factors, assignment)
        )

    @classmethod
    def _analyze_engagement_risk(cls, assignment):
        """
        Анализирует риск низкой вовлеченности в онбординг
        """
        # Получаем данные о прогрессе
        progress_data = cls._get_user_progress_data(assignment)

        # Базовый уровень риска
        base_risk = 0.05

        # Факторы, увеличивающие риск
        risk_factors = []

        # Фактор 1: Редкая активность
        if progress_data['last_activity_time']:
            days_inactive = (timezone.now() -
                             progress_data['last_activity_time']).days
            if days_inactive > 2:
                inactivity_factor = min(days_inactive / 7 * 0.3, 0.3)
                risk_factors.append(('inactivity', inactivity_factor))
        else:
            risk_factors.append(('no_activity', 0.3))

        # Фактор 2: Отсутствие фидбека или пропуски в заполнении фидбека
        from feedback.models import OnboardingFeedback

        total_feedback_opportunities = UserStepProgress.objects.filter(
            user=assignment.user,
            step__program=assignment.program,
            status=UserStepProgress.ProgressStatus.DONE
        ).count()

        actual_feedbacks = OnboardingFeedback.objects.filter(
            user=assignment.user,
            assignment=assignment
        ).count()

        if total_feedback_opportunities > 0:
            missed_feedback_ratio = 1 - \
                (actual_feedbacks / total_feedback_opportunities)
            if missed_feedback_ratio > 0.3:
                feedback_factor = min(missed_feedback_ratio * 0.3, 0.3)
                risk_factors.append(('missed_feedback', feedback_factor))

        # Фактор 3: Аномалии, связанные со слабой вовлеченностью
        engagement_anomalies = OnboardingAnomaly.objects.filter(
            assignment=assignment,
            anomaly_type__in=[
                OnboardingAnomaly.AnomalyType.SKIPPED_FEEDBACK,
                OnboardingAnomaly.AnomalyType.UNUSUAL_ACTIVITY
            ],
            resolved=False
        ).count()

        if engagement_anomalies > 0:
            anomaly_factor = min(engagement_anomalies * 0.1, 0.3)
            risk_factors.append(('engagement_anomalies', anomaly_factor))

        # Финальная вероятность риска
        probability = base_risk
        for _, factor_value in risk_factors:
            probability += factor_value

        # Нормализуем до диапазона [0, 1]
        probability = min(probability, 1.0)

        # Определяем серьезность риска
        severity = cls._determine_risk_severity(probability)

        # Сохраняем прогноз риска
        OnboardingRiskPrediction.objects.create(
            user=assignment.user,
            assignment=assignment,
            department=assignment.user.department,
            risk_type=OnboardingRiskPrediction.RiskType.ENGAGEMENT_RISK,
            severity=severity,
            probability=probability,
            factors={factor_name: float(factor_value)
                     for factor_name, factor_value in risk_factors},
            estimated_impact="Низкая вовлеченность может привести к формальному прохождению онбординга без "
            "усвоения важных знаний и навыков, что повлияет на дальнейшую работу.",
            recommendation=cls._generate_engagement_risk_recommendation(
                risk_factors, assignment)
        )

    @classmethod
    def _analyze_knowledge_retention_risk(cls, assignment):
        """
        Анализирует риск недостаточного усвоения информации во время онбординга
        """
        # Получаем данные о прогрессе
        progress_data = cls._get_user_progress_data(assignment)

        # Базовый уровень риска
        base_risk = 0.05

        # Факторы, увеличивающие риск
        risk_factors = []

        # Фактор 1: Быстрое прохождение шагов типа обучения
        training_steps = UserStepProgress.objects.filter(
            user=assignment.user,
            step__program=assignment.program,
            step__step_type=OnboardingStep.StepType.TRAINING,
            status=UserStepProgress.ProgressStatus.DONE,
            actual_completed_at__isnull=False,
            planned_date_start__isnull=False
        )

        if training_steps.exists():
            fast_completions = 0
            for step in training_steps:
                # Минимальное ожидаемое время на обучение
                expected_min_duration = datetime.timedelta(hours=1)
                actual_duration = step.actual_completed_at - step.planned_date_start
                if actual_duration < expected_min_duration:
                    fast_completions += 1

            if fast_completions > 0:
                fast_training_factor = min(
                    fast_completions / max(training_steps.count(), 1) * 0.3, 0.3)
                risk_factors.append(
                    ('fast_training_completion', fast_training_factor))

        # Фактор 2: Ошибки в тестах или заданиях
        anomalies = OnboardingAnomaly.objects.filter(
            assignment=assignment,
            anomaly_type=OnboardingAnomaly.AnomalyType.TEST_FAILURES
        ).count()

        if anomalies > 0:
            test_failures_factor = min(anomalies * 0.15, 0.3)
            risk_factors.append(('test_failures', test_failures_factor))

        # Фактор 3: Слишком быстрое прохождение онбординга в целом
        snapshots = OnboardingProgressSnapshot.objects.filter(
            assignment=assignment
        ).order_by('snapshot_date')

        if snapshots.count() >= 2:
            first_snapshot = snapshots.first()
            last_snapshot = snapshots.last()
            days_diff = (last_snapshot.snapshot_date -
                         first_snapshot.snapshot_date).days
            progress_diff = last_snapshot.completion_percentage - \
                first_snapshot.completion_percentage

            if days_diff > 0 and progress_diff > 0:
                # Скорость прохождения более 15% в день считается слишком быстрой для хорошего усвоения
                progress_rate = progress_diff / days_diff
                if progress_rate > 15:
                    fast_progress_factor = min(
                        (progress_rate - 15) / 15 * 0.3, 0.3)
                    risk_factors.append(
                        ('fast_progress_rate', fast_progress_factor))

        # Финальная вероятность риска
        probability = base_risk
        for _, factor_value in risk_factors:
            probability += factor_value

        # Нормализуем до диапазона [0, 1]
        probability = min(probability, 1.0)

        # Определяем серьезность риска
        severity = cls._determine_risk_severity(probability)

        # Сохраняем прогноз риска
        OnboardingRiskPrediction.objects.create(
            user=assignment.user,
            assignment=assignment,
            department=assignment.user.department,
            risk_type=OnboardingRiskPrediction.RiskType.KNOWLEDGE_RETENTION_RISK,
            severity=severity,
            probability=probability,
            factors={factor_name: float(factor_value)
                     for factor_name, factor_value in risk_factors},
            estimated_impact="Недостаточное усвоение информации может привести к пробелам в знаниях и навыках, "
            "что повлияет на качество работы и потребует дополнительного обучения в будущем.",
            recommendation=cls._generate_knowledge_retention_recommendation(
                risk_factors, assignment)
        )

    @staticmethod
    def _get_user_progress_data(assignment):
        """
        Получает данные о прогрессе пользователя для анализа
        """
        latest_snapshot = OnboardingProgressSnapshot.objects.filter(
            assignment=assignment
        ).order_by('-snapshot_date').first()

        if latest_snapshot:
            return {
                'completion_percentage': latest_snapshot.completion_percentage,
                'steps_total': latest_snapshot.steps_total,
                'steps_completed': latest_snapshot.steps_completed,
                'steps_in_progress': latest_snapshot.steps_in_progress,
                'steps_not_started': latest_snapshot.steps_not_started,
                'steps_overdue': latest_snapshot.steps_overdue,
                'avg_step_completion_time': latest_snapshot.avg_step_completion_time,
                'last_activity_time': latest_snapshot.last_activity_time,
            }
        else:
            # Если снимок отсутствует, вычисляем базовые метрики
            steps = UserStepProgress.objects.filter(
                user=assignment.user,
                step__program=assignment.program
            )

            total_steps = steps.count()
            completed_steps = steps.filter(
                status=UserStepProgress.ProgressStatus.DONE
            ).count()

            in_progress_steps = steps.filter(
                status=UserStepProgress.ProgressStatus.IN_PROGRESS
            ).count()

            not_started_steps = steps.filter(
                status=UserStepProgress.ProgressStatus.NOT_STARTED
            ).count()

            # Определяем просроченные шаги
            now = timezone.now()
            overdue_steps = steps.filter(
                Q(planned_date_end__lt=now) &
                ~Q(status=UserStepProgress.ProgressStatus.DONE)
            ).count()

            # Последняя активность
            last_activity = steps.filter(
                ~Q(status=UserStepProgress.ProgressStatus.NOT_STARTED)
            ).order_by('-actual_completed_at', '-completed_at').first()

            last_activity_time = None
            if last_activity:
                if last_activity.actual_completed_at:
                    last_activity_time = last_activity.actual_completed_at
                elif last_activity.completed_at:
                    last_activity_time = last_activity.completed_at

            # Вычисляем процент прогресса
            completion_percentage = (
                completed_steps / total_steps) * 100.0 if total_steps > 0 else 0.0

            return {
                'completion_percentage': completion_percentage,
                'steps_total': total_steps,
                'steps_completed': completed_steps,
                'steps_in_progress': in_progress_steps,
                'steps_not_started': not_started_steps,
                'steps_overdue': overdue_steps,
                'avg_step_completion_time': None,
                'last_activity_time': last_activity_time,
            }

    @staticmethod
    def _determine_risk_severity(probability):
        """
        Определяет серьезность риска на основе вероятности
        """
        if probability >= 0.6:
            return OnboardingRiskPrediction.RiskSeverity.HIGH
        elif probability >= 0.3:
            return OnboardingRiskPrediction.RiskSeverity.MEDIUM
        else:
            return OnboardingRiskPrediction.RiskSeverity.LOW

    @staticmethod
    def _generate_completion_risk_recommendation(risk_factors, assignment):
        """
        Генерирует рекомендации по снижению риска незавершения онбординга
        """
        recommendations = []

        for factor_name, _ in risk_factors:
            if factor_name == 'overdue_steps':
                recommendations.append("Проверьте просроченные шаги и помогите сотруднику с их выполнением. "
                                       "При необходимости скорректируйте сроки выполнения шагов.")

            elif factor_name in ('inactivity', 'no_activity'):
                recommendations.append("Свяжитесь с сотрудником для выяснения причин низкой активности. "
                                       "Возможно, требуется дополнительная поддержка или мотивация.")

            elif factor_name == 'slow_progress':
                recommendations.append("Оцените сложность программы онбординга для данного сотрудника. "
                                       "Возможно, требуется упростить некоторые шаги или предоставить дополнительное обучение.")

            elif factor_name == 'anomalies':
                recommendations.append("Обратите внимание на выявленные аномалии в процессе онбординга и "
                                       "примите меры по их устранению.")

        # Если нет конкретных рекомендаций, даем общую рекомендацию
        if not recommendations:
            recommendations.append(
                "Регулярно контролируйте прогресс сотрудника и предоставляйте своевременную поддержку.")

        return " ".join(recommendations)

    @staticmethod
    def _generate_delay_risk_recommendation(risk_factors, assignment):
        """
        Генерирует рекомендации по снижению риска задержек в онбординге
        """
        recommendations = []

        for factor_name, _ in risk_factors:
            if factor_name == 'overdue_steps':
                recommendations.append("Выявите просроченные шаги и помогите сотруднику в их приоритизации. "
                                       "Рассмотрите возможность корректировки дедлайнов при необходимости.")

            elif factor_name == 'soon_due_steps':
                recommendations.append("Обратите внимание на шаги с приближающимися дедлайнами и предупредите "
                                       "сотрудника о необходимости их скорейшего выполнения.")

            elif factor_name == 'delay_history':
                recommendations.append("Проанализируйте причины задержек при выполнении предыдущих шагов. "
                                       "Возможно, требуется дополнительное обучение или поддержка.")

        # Если нет конкретных рекомендаций, даем общую рекомендацию
        if not recommendations:
            recommendations.append(
                "Контролируйте соблюдение графика онбординга и оперативно реагируйте на возможные задержки.")

        return " ".join(recommendations)

    @staticmethod
    def _generate_engagement_risk_recommendation(risk_factors, assignment):
        """
        Генерирует рекомендации по снижению риска низкой вовлеченности
        """
        recommendations = []

        for factor_name, _ in risk_factors:
            if factor_name in ('inactivity', 'no_activity'):
                recommendations.append("Инициируйте личную встречу с сотрудником для обсуждения его прогресса и возможных проблем. "
                                       "Рассмотрите дополнительные способы вовлечения и мотивации.")

            elif factor_name == 'missed_feedback':
                recommendations.append("Подчеркните важность заполнения форм обратной связи. "
                                       "Рассмотрите возможность упрощения процесса сбора фидбека.")

            elif factor_name == 'engagement_anomalies':
                recommendations.append("Обратите внимание на аномалии, связанные с вовлеченностью сотрудника, "
                                       "и примите меры по их устранению.")

        # Если нет конкретных рекомендаций, даем общую рекомендацию
        if not recommendations:
            recommendations.append("Регулярно проверяйте уровень вовлеченности сотрудника в процесс онбординга и "
                                   "предоставляйте конструктивную обратную связь.")

        return " ".join(recommendations)

    @staticmethod
    def _generate_knowledge_retention_recommendation(risk_factors, assignment):
        """
        Генерирует рекомендации по снижению риска недостаточного усвоения информации
        """
        recommendations = []

        for factor_name, _ in risk_factors:
            if factor_name == 'fast_training_completion':
                recommendations.append("Проверьте фактическое усвоение материала обучения через короткие тесты или "
                                       "беседу с сотрудником. При необходимости рекомендуйте повторное изучение важных материалов.")

            elif factor_name == 'test_failures':
                recommendations.append("Проанализируйте типы ошибок в тестах и предоставьте целенаправленное обучение "
                                       "по проблемным темам.")

            elif factor_name == 'fast_progress_rate':
                recommendations.append("Слишком быстрое прохождение онбординга может указывать на поверхностное изучение материалов. "
                                       "Рекомендуется провести проверку знаний по ключевым темам.")

        # Если нет конкретных рекомендаций, даем общую рекомендацию
        if not recommendations:
            recommendations.append(
                "Регулярно проверяйте усвоение ключевых знаний и навыков через практические задания или обсуждения.")

        return " ".join(recommendations)


class AnomalyDetectionService:
    """
    Сервис для выявления аномалий в процессе онбординга
    """

    @classmethod
    def detect_anomalies(cls, user=None, department=None, all_users=False):
        """
        Выявляет аномалии в онбординге для заданного пользователя, департамента или всех пользователей
        """
        queryset = UserOnboardingAssignment.objects.filter(
            status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
        ).select_related('user', 'program', 'user__department')

        if user and not all_users:
            queryset = queryset.filter(user=user)
        elif department and not all_users:
            queryset = queryset.filter(user__department=department)

        for assignment in queryset:
            # Проверяем на медленный прогресс
            cls._detect_slow_progress(assignment)

            # Проверяем на пропуски в заполнении фидбека
            cls._detect_skipped_feedback(assignment)

            # Проверяем на ошибки в тестах
            cls._detect_test_failures(assignment)

            # Проверяем на частые переназначения менторов
            cls._detect_mentor_reassignments(assignment)

            # Проверяем необычные паттерны активности
            cls._detect_unusual_activity_patterns(assignment)

    @staticmethod
    def _detect_slow_progress(assignment):
        """
        Выявляет аномально медленный прогресс в онбординге
        """
        # Получаем последние два снимка прогресса
        snapshots = OnboardingProgressSnapshot.objects.filter(
            assignment=assignment
        ).order_by('-snapshot_date')[:2]

        if len(snapshots) < 2:
            return

        latest_snapshot = snapshots[0]
        previous_snapshot = snapshots[1]

        # Проверяем разницу во времени между снимками
        time_diff = latest_snapshot.snapshot_date - previous_snapshot.snapshot_date
        # Минимальный интервал для анализа
        min_time_diff = datetime.timedelta(days=2)

        # Проверяем только если прошло достаточно времени
        if time_diff >= min_time_diff:
            progress_diff = latest_snapshot.completion_percentage - \
                previous_snapshot.completion_percentage

            # Если прогресс слишком медленный (менее 5% за неделю при общем прогрессе менее 90%)
            days_diff = time_diff.days
            # Нормализуем до недельного прироста
            weekly_progress_rate = (progress_diff / days_diff) * 7

            if weekly_progress_rate < 5 and latest_snapshot.completion_percentage < 90:
                # Проверяем, не создавалась ли уже такая аномалия недавно
                recent_anomaly = OnboardingAnomaly.objects.filter(
                    assignment=assignment,
                    anomaly_type=OnboardingAnomaly.AnomalyType.SLOW_PROGRESS,
                    detected_at__gte=timezone.now() - datetime.timedelta(days=7),
                    resolved=False
                ).exists()

                if not recent_anomaly:
                    # Создаем аномалию
                    OnboardingAnomaly.objects.create(
                        user=assignment.user,
                        assignment=assignment,
                        department=assignment.user.department,
                        anomaly_type=OnboardingAnomaly.AnomalyType.SLOW_PROGRESS,
                        description=f"Медленный прогресс онбординга: {weekly_progress_rate:.1f}% в неделю",
                        details={
                            'current_percentage': latest_snapshot.completion_percentage,
                            'previous_percentage': previous_snapshot.completion_percentage,
                            'weekly_progress_rate': weekly_progress_rate,
                            'time_diff_days': days_diff
                        }
                    )

    @staticmethod
    def _detect_skipped_feedback(assignment):
        """
        Выявляет пропуски в заполнении фидбека
        """
        from feedback.models import OnboardingFeedback

        # Получаем завершенные шаги, требующие фидбека
        completed_steps = UserStepProgress.objects.filter(
            user=assignment.user,
            step__program=assignment.program,
            status=UserStepProgress.ProgressStatus.DONE,
            completed_at__isnull=False
        ).select_related('step')

        # Для каждого завершенного шага проверяем наличие фидбека
        for step_progress in completed_steps:
            # Проверяем, был ли оставлен фидбек по данному шагу
            feedback_exists = OnboardingFeedback.objects.filter(
                user=assignment.user,
                assignment=assignment,
                step=step_progress.step
            ).exists()

            # Если фидбека нет и с момента завершения шага прошло более 2 дней
            if not feedback_exists and step_progress.completed_at:
                days_since_completion = (
                    timezone.now() - step_progress.completed_at).days
                if days_since_completion > 2:
                    # Проверяем, не создавалась ли уже такая аномалия для этого шага
                    recent_anomaly = OnboardingAnomaly.objects.filter(
                        assignment=assignment,
                        anomaly_type=OnboardingAnomaly.AnomalyType.SKIPPED_FEEDBACK,
                        step=step_progress,
                        resolved=False
                    ).exists()

                    if not recent_anomaly:
                        # Создаем аномалию
                        OnboardingAnomaly.objects.create(
                            user=assignment.user,
                            assignment=assignment,
                            department=assignment.user.department,
                            anomaly_type=OnboardingAnomaly.AnomalyType.SKIPPED_FEEDBACK,
                            step=step_progress,
                            description=f"Пропущен фидбек по шагу: {step_progress.step.name}",
                            details={
                                'step_name': step_progress.step.name,
                                'completed_at': step_progress.completed_at.isoformat(),
                                'days_since_completion': days_since_completion
                            }
                        )

    @staticmethod
    def _detect_test_failures(assignment):
        """
        Выявляет повторяющиеся ошибки в тестах
        """
        # Проверяем, имеются ли в системе данные о неудачных попытках тестирования
        from gamification.models import UserActivity

        # Получаем данные о неудачных тестах
        failed_tests = UserActivity.objects.filter(
            user=assignment.user,
            activity_type='test_failed',
            created_at__gte=timezone.now() - datetime.timedelta(days=30)
        ).values('metadata__test_id').annotate(
            failure_count=Count('id')
        ).filter(failure_count__gt=1)

        for test in failed_tests:
            test_id = test['metadata__test_id']
            failure_count = test['failure_count']

            # Если тест провален более одного раза
            if failure_count > 1:
                # Проверяем, не создавалась ли уже такая аномалия для этого теста
                recent_anomaly = OnboardingAnomaly.objects.filter(
                    assignment=assignment,
                    anomaly_type=OnboardingAnomaly.AnomalyType.TEST_FAILURES,
                    details__test_id=test_id,
                    resolved=False
                ).exists()

                if not recent_anomaly:
                    # Получаем информацию о последней попытке
                    last_attempt = UserActivity.objects.filter(
                        user=assignment.user,
                        activity_type='test_failed',
                        metadata__test_id=test_id
                    ).order_by('-created_at').first()

                    test_name = last_attempt.metadata.get(
                        'test_name', 'Неизвестный тест')

                    # Создаем аномалию
                    OnboardingAnomaly.objects.create(
                        user=assignment.user,
                        assignment=assignment,
                        department=assignment.user.department,
                        anomaly_type=OnboardingAnomaly.AnomalyType.TEST_FAILURES,
                        description=f"Повторные неудачи в тесте: {test_name} ({failure_count} провалов)",
                        details={
                            'test_id': test_id,
                            'test_name': test_name,
                            'failure_count': failure_count,
                            'last_failure_date': last_attempt.created_at.isoformat() if last_attempt else None
                        }
                    )

    @staticmethod
    def _detect_mentor_reassignments(assignment):
        """
        Выявляет частые переназначения менторов
        """
        from users.models import UserRole

        # Получаем историю изменений менторов
        from core.models import ActivityLog

        mentor_changes = ActivityLog.objects.filter(
            action_type='mentor_changed',
            target_user=assignment.user,
            created_at__gte=timezone.now() - datetime.timedelta(days=30)
        ).count()

        # Если было более 2 изменений менторов за 30 дней
        if mentor_changes > 2:
            # Проверяем, не создавалась ли уже такая аномалия
            recent_anomaly = OnboardingAnomaly.objects.filter(
                assignment=assignment,
                anomaly_type=OnboardingAnomaly.AnomalyType.MENTOR_REASSIGNMENTS,
                detected_at__gte=timezone.now() - datetime.timedelta(days=15),
                resolved=False
            ).exists()

            if not recent_anomaly:
                # Создаем аномалию
                OnboardingAnomaly.objects.create(
                    user=assignment.user,
                    assignment=assignment,
                    department=assignment.user.department,
                    anomaly_type=OnboardingAnomaly.AnomalyType.MENTOR_REASSIGNMENTS,
                    description=f"Частые смены ментора: {mentor_changes} раз за 30 дней",
                    details={
                        'changes_count': mentor_changes,
                        'period_days': 30
                    }
                )

    @staticmethod
    def _detect_unusual_activity_patterns(assignment):
        """
        Выявляет необычные паттерны активности в процессе онбординга
        """
        from core.models import UserActivityLog

        # Получаем логи активности пользователя за последние 14 дней
        user_logs = UserActivityLog.objects.filter(
            user=assignment.user,
            created_at__gte=timezone.now() - datetime.timedelta(days=14)
        )

        # Если логов мало или нет, значит есть риск низкой активности
        if user_logs.count() < 5:
            # Проверяем, не создавалась ли уже такая аномалия
            recent_anomaly = OnboardingAnomaly.objects.filter(
                assignment=assignment,
                anomaly_type=OnboardingAnomaly.AnomalyType.UNUSUAL_ACTIVITY,
                detected_at__gte=timezone.now() - datetime.timedelta(days=7),
                resolved=False
            ).exists()

            if not recent_anomaly:
                # Создаем аномалию о низкой активности
                OnboardingAnomaly.objects.create(
                    user=assignment.user,
                    assignment=assignment,
                    department=assignment.user.department,
                    anomaly_type=OnboardingAnomaly.AnomalyType.UNUSUAL_ACTIVITY,
                    description="Необычно низкая активность в системе",
                    details={
                        'activity_count': user_logs.count(),
                        'period_days': 14,
                        'pattern': 'low_activity'
                    }
                )
            return

        # Анализируем время активности пользователя
        activity_hours = user_logs.annotate(
            hour=Extract('created_at', 'hour')
        ).values('hour').annotate(count=Count('id')).order_by('hour')

        # Конвертируем в массив для анализа
        hour_counts = [0] * 24
        for item in activity_hours:
            hour_counts[item['hour']] = item['count']

        # Находим периоды активности
        total_logs = sum(hour_counts)
        night_activity = sum(hour_counts[23:] + hour_counts[:6])
        night_activity_percentage = (
            night_activity / total_logs) * 100 if total_logs > 0 else 0

        # Если более 30% активности приходится на ночное время (23:00-06:00)
        if night_activity_percentage > 30:
            # Проверяем, не создавалась ли уже такая аномалия
            recent_anomaly = OnboardingAnomaly.objects.filter(
                assignment=assignment,
                anomaly_type=OnboardingAnomaly.AnomalyType.UNUSUAL_ACTIVITY,
                detected_at__gte=timezone.now() - datetime.timedelta(days=7),
                resolved=False,
                details__pattern='night_activity'
            ).exists()

            if not recent_anomaly:
                # Создаем аномалию о ночной активности
                OnboardingAnomaly.objects.create(
                    user=assignment.user,
                    assignment=assignment,
                    department=assignment.user.department,
                    anomaly_type=OnboardingAnomaly.AnomalyType.UNUSUAL_ACTIVITY,
                    description=f"Необычно высокая ночная активность ({night_activity_percentage:.1f}%)",
                    details={
                        'night_activity_percentage': night_activity_percentage,
                        'period_days': 14,
                        'pattern': 'night_activity'
                    }
                )
