from typing import List, Dict, Any
from django.db.models import Count, Avg, F, Q, Case, When
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType

from users.models import User
from departments.models import Department
from onboarding.models import UserOnboardingAssignment, OnboardingStep
from onboarding.feedback_models import StepFeedback
from notifications.models import Notification
from ..models.hr_dashboard import HRMetricSnapshot, HRAlert, HRAlertRule


class HRDashboardAggregatorService:
    """
    Сервис для агрегации метрик и формирования сводки HR-дашборда
    """
    @classmethod
    def collect_metrics(cls) -> Dict[str, float]:
        """
        Собирает текущие метрики для дашборда
        """
        # Базовые метрики по онбордингу
        onboarding_metrics = cls._get_onboarding_metrics()

        # Метрики по отзывам
        feedback_metrics = cls._get_feedback_metrics()

        # Метрики по департаментам
        department_metrics = cls._get_department_metrics()

        # Объединяем все метрики
        return {
            **onboarding_metrics,
            **feedback_metrics,
            **department_metrics
        }

    @classmethod
    def _get_onboarding_metrics(cls) -> Dict[str, float]:
        """
        Получает метрики по онбордингу
        """
        active_assignments = UserOnboardingAssignment.objects.filter(
            status='active'
        )

        return {
            'active_onboarding_count': active_assignments.count(),
            'avg_completion_rate': active_assignments.aggregate(
                avg=Avg('completion_rate')
            )['avg'] or 0,
            'overdue_steps_count': OnboardingStep.objects.filter(
                userstepprogress__status='overdue'
            ).count()
        }

    @classmethod
    def _get_feedback_metrics(cls) -> Dict[str, float]:
        """
        Получает метрики по отзывам
        """
        recent_feedback = StepFeedback.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=30)
        )

        total_feedback = recent_feedback.count()
        if total_feedback == 0:
            return {
                'negative_feedback_rate': 0,
                'avg_sentiment_score': 0
            }

        return {
            'negative_feedback_rate': (
                recent_feedback.filter(
                    Q(sentiment_score__lt=-0.3) |
                    Q(auto_tag__in=['negative',
                      'delay_warning', 'unclear_instruction'])
                ).count() / total_feedback * 100
            ),
            'avg_sentiment_score': recent_feedback.aggregate(
                avg=Avg('sentiment_score')
            )['avg'] or 0
        }

    @classmethod
    def _get_department_metrics(cls) -> Dict[str, float]:
        """
        Получает метрики по департаментам
        """
        departments = Department.objects.annotate(
            active_employees=Count(
                'users',
                filter=Q(users__onboarding_assignments__status='active')
            ),
            completed_employees=Count(
                'users',
                filter=Q(users__onboarding_assignments__status='completed')
            )
        )

        total_departments = departments.count()
        if total_departments == 0:
            return {
                'avg_department_completion_rate': 0
            }

        return {
            'avg_department_completion_rate': sum(
                dept.completed_employees /
                (dept.active_employees + dept.completed_employees)
                if (dept.active_employees + dept.completed_employees) > 0
                else 0
                for dept in departments
            ) / total_departments * 100
        }

    @classmethod
    def store_current_snapshot(cls):
        """
        Сохраняет текущий снэпшот метрик
        """
        metrics = cls.collect_metrics()

        # Сохраняем общие метрики
        for key, value in metrics.items():
            HRMetricSnapshot.objects.create(
                metric_key=key,
                metric_value=value
            )

        # Сохраняем метрики по департаментам
        for dept in Department.objects.all():
            completion_rate = cls._calculate_department_completion_rate(dept)
            HRMetricSnapshot.objects.create(
                metric_key='department_completion_rate',
                metric_value=completion_rate,
                department=dept
            )

    @classmethod
    def _calculate_department_completion_rate(cls, department: Department) -> float:
        """
        Рассчитывает процент завершения онбординга для департамента
        """
        stats = department.users.aggregate(
            active=Count('onboarding_assignments', filter=Q(
                onboarding_assignments__status='active')),
            completed=Count('onboarding_assignments', filter=Q(
                onboarding_assignments__status='completed'))
        )

        total = stats['active'] + stats['completed']
        if total == 0:
            return 0

        return (stats['completed'] / total) * 100


class HRRealTimeAlertService:
    """
    Сервис для проверки правил и формирования HR-алертов
    """
    @classmethod
    def check_alert_rules(cls):
        """
        Проверяет все активные правила и создает алерты при необходимости
        """
        metrics = HRDashboardAggregatorService.collect_metrics()
        active_rules = HRAlertRule.objects.filter(is_active=True)

        for rule in active_rules:
            if cls._should_create_alert(rule, metrics):
                cls._create_alert(rule, metrics)

    @classmethod
    def _should_create_alert(cls, rule: HRAlertRule, metrics: Dict[str, float]) -> bool:
        """
        Проверяет, должен ли быть создан алерт по правилу
        """
        if rule.metric_key not in metrics:
            return False

        current_value = metrics[rule.metric_key]

        if rule.comparison == 'gt':
            return current_value > rule.threshold_value
        elif rule.comparison == 'lt':
            return current_value < rule.threshold_value
        else:  # eq
            return abs(current_value - rule.threshold_value) < 0.001

    @classmethod
    def _create_alert(cls, rule: HRAlertRule, metrics: Dict[str, float]):
        """
        Создает новый алерт на основе правила
        """
        # Проверяем, нет ли уже открытого алерта для этого правила
        existing_alert = HRAlert.objects.filter(
            rule=rule,
            status=HRAlert.Status.OPEN
        ).first()

        if existing_alert:
            return

        # Создаем новый алерт
        alert = HRAlert.objects.create(
            title=f"Alert: {rule.name}",
            message=cls._format_alert_message(rule, metrics),
            rule=rule,
            severity=rule.severity,
            status=HRAlert.Status.OPEN
        )

        # Создаем уведомления для HR и админов
        cls._notify_stakeholders(alert)

    @classmethod
    def _format_alert_message(cls, rule: HRAlertRule, metrics: Dict[str, float]) -> str:
        """
        Форматирует сообщение алерта
        """
        current_value = metrics.get(rule.metric_key, 0)
        comparison_text = {
            'gt': 'превысило',
            'lt': 'ниже',
            'eq': 'равно'
        }[rule.comparison]

        return (
            f"{rule.description}\n\n"
            f"Текущее значение {rule.metric_key}: {current_value}\n"
            f"{comparison_text} порогового значения: {rule.threshold_value}"
        )

    @classmethod
    def _notify_stakeholders(cls, alert: HRAlert):
        """
        Отправляет уведомления заинтересованным лицам
        """
        stakeholders = []

        # Собираем HR-менеджеров
        if alert.rule.notify_hr:
            stakeholders.extend(
                User.objects.filter(role='hr')
            )

        # Собираем администраторов
        if alert.rule.notify_admin:
            stakeholders.extend(
                User.objects.filter(role='admin')
            )

        # Создаем уведомления
        for user in stakeholders:
            Notification.objects.create(
                recipient=user,
                title=f"HR Alert: {alert.title}",
                message=alert.message,
                notification_type='warning',
                content_type=ContentType.objects.get_for_model(alert),
                object_id=alert.id
            )
