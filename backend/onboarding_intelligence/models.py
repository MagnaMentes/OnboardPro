from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from departments.models import Department
from onboarding.models import UserOnboardingAssignment, UserStepProgress


class OnboardingProgressSnapshot(models.Model):
    """
    Модель для хранения снимков прогресса онбординга пользователей
    для последующего анализа и построения дашборда
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress_snapshots',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        UserOnboardingAssignment,
        on_delete=models.CASCADE,
        related_name='progress_snapshots',
        verbose_name=_('assignment')
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='department_snapshots',
        verbose_name=_('department')
    )
    completion_percentage = models.FloatField(_('completion percentage'))
    steps_total = models.PositiveIntegerField(_('total steps'))
    steps_completed = models.PositiveIntegerField(_('completed steps'))
    steps_in_progress = models.PositiveIntegerField(_('steps in progress'))
    steps_not_started = models.PositiveIntegerField(_('steps not started'))
    steps_overdue = models.PositiveIntegerField(_('overdue steps'), default=0)
    avg_step_completion_time = models.DurationField(
        _('average step completion time'),
        null=True,
        blank=True
    )
    last_activity_time = models.DateTimeField(
        _('last activity time'),
        null=True,
        blank=True
    )
    snapshot_date = models.DateTimeField(
        _('snapshot date'), default=timezone.now)

    class Meta:
        verbose_name = _('onboarding progress snapshot')
        verbose_name_plural = _('onboarding progress snapshots')
        ordering = ['-snapshot_date']
        indexes = [
            models.Index(fields=['user', 'snapshot_date']),
            models.Index(fields=['department', 'snapshot_date']),
        ]

    def __str__(self):
        return f"{self.user.email} Progress - {self.completion_percentage:.1f}% ({self.snapshot_date.strftime('%Y-%m-%d')})"


class OnboardingRiskPrediction(models.Model):
    """
    Модель для хранения прогнозов рисков онбординга
    """
    class RiskType(models.TextChoices):
        COMPLETION_RISK = 'completion', _('Completion Risk')
        DELAY_RISK = 'delay', _('Delay Risk')
        ENGAGEMENT_RISK = 'engagement', _('Engagement Risk')
        KNOWLEDGE_RETENTION_RISK = 'knowledge', _('Knowledge Retention Risk')

    class RiskSeverity(models.TextChoices):
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='risk_predictions',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        UserOnboardingAssignment,
        on_delete=models.CASCADE,
        related_name='risk_predictions',
        verbose_name=_('assignment')
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='department_risks',
        verbose_name=_('department')
    )
    risk_type = models.CharField(
        _('risk type'),
        max_length=20,
        choices=RiskType.choices
    )
    severity = models.CharField(
        _('severity'),
        max_length=20,
        choices=RiskSeverity.choices
    )
    probability = models.FloatField(
        _('probability'),
        help_text=_('Probability from 0.0 to 1.0')
    )
    factors = models.JSONField(
        _('contributing factors'),
        default=dict,
        help_text=_('Factors contributing to this risk')
    )
    estimated_impact = models.TextField(
        _('estimated impact'),
        blank=True
    )
    recommendation = models.TextField(
        _('recommendation'),
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('onboarding risk prediction')
        verbose_name_plural = _('onboarding risk predictions')
        ordering = ['-probability', '-created_at']
        indexes = [
            models.Index(fields=['user', 'risk_type']),
            models.Index(fields=['assignment', 'risk_type']),
            models.Index(fields=['department', 'risk_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.get_risk_type_display()} ({self.get_severity_display()})"


class OnboardingAnomaly(models.Model):
    """
    Модель для хранения аномалий, выявленных в процессе онбординга
    """
    class AnomalyType(models.TextChoices):
        SLOW_PROGRESS = 'slow_progress', _('Slow Progress')
        SKIPPED_FEEDBACK = 'skipped_feedback', _('Skipped Feedback')
        TEST_FAILURES = 'test_failures', _('Test Failures')
        MENTOR_REASSIGNMENTS = 'mentor_reassignments', _(
            'Mentor Reassignments')
        UNUSUAL_ACTIVITY = 'unusual_activity', _('Unusual Activity Pattern')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='onboarding_anomalies',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        UserOnboardingAssignment,
        on_delete=models.CASCADE,
        related_name='anomalies',
        verbose_name=_('assignment')
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='department_anomalies',
        verbose_name=_('department')
    )
    anomaly_type = models.CharField(
        _('anomaly type'),
        max_length=30,
        choices=AnomalyType.choices
    )
    step = models.ForeignKey(
        UserStepProgress,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='anomalies',
        verbose_name=_('step')
    )
    description = models.TextField(_('description'))
    details = models.JSONField(_('details'), default=dict)
    detected_at = models.DateTimeField(_('detected at'), default=timezone.now)
    resolved = models.BooleanField(_('resolved'), default=False)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)
    resolution_notes = models.TextField(_('resolution notes'), blank=True)

    class Meta:
        verbose_name = _('onboarding anomaly')
        verbose_name_plural = _('onboarding anomalies')
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['user', 'anomaly_type']),
            models.Index(fields=['department', 'anomaly_type']),
            models.Index(fields=['resolved', 'detected_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.get_anomaly_type_display()}"

    def resolve(self, notes=''):
        """
        Отмечает аномалию как решенную и сохраняет заметки о решении
        """
        self.resolved = True
        self.resolved_at = timezone.now()
        self.resolution_notes = notes
        self.save()


class OnboardingDepartmentSummary(models.Model):
    """
    Модель для хранения агрегированной статистики по департаментам
    """
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='onboarding_summaries',
        verbose_name=_('department')
    )
    active_onboardings = models.PositiveIntegerField(_('active onboardings'))
    completed_onboardings = models.PositiveIntegerField(
        _('completed onboardings'))
    avg_completion_time = models.DurationField(
        _('average completion time'),
        null=True,
        blank=True
    )
    avg_completion_percentage = models.FloatField(
        _('average completion percentage'))
    risk_factor = models.FloatField(
        _('risk factor'),
        help_text=_('Overall risk factor for the department')
    )
    most_common_bottlenecks = models.JSONField(
        _('most common bottlenecks'),
        default=dict
    )
    summary_date = models.DateTimeField(
        _('summary date'), default=timezone.now)

    class Meta:
        verbose_name = _('onboarding department summary')
        verbose_name_plural = _('onboarding department summaries')
        ordering = ['-summary_date']
        indexes = [
            models.Index(fields=['department', 'summary_date']),
        ]

    def __str__(self):
        return f"{self.department.name} Summary ({self.summary_date.strftime('%Y-%m-%d')})"
