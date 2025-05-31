from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from .models import FeedbackTemplate, UserFeedback
from users.models import User


class FeedbackTrendSnapshot(models.Model):
    """
    Модель для хранения исторических срезов трендов обратной связи
    """
    template = models.ForeignKey(
        FeedbackTemplate,
        on_delete=models.CASCADE,
        related_name='trend_snapshots',
        verbose_name=_('template'),
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        related_name='feedback_trend_snapshots',
        verbose_name=_('department'),
        null=True,
        blank=True
    )
    date = models.DateField(_('date'), default=timezone.now)
    sentiment_score = models.FloatField(_('sentiment score'), default=0.0)
    response_count = models.IntegerField(_('response count'), default=0)
    main_topics = models.JSONField(_('main topics'), default=dict)
    common_issues = models.JSONField(_('common issues'), default=dict)
    satisfaction_index = models.FloatField(
        _('satisfaction index'), default=0.0)

    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('feedback trend snapshot')
        verbose_name_plural = _('feedback trend snapshots')
        ordering = ['-date']
        unique_together = ['template', 'department', 'date']

    def __str__(self):
        template_name = self.template.title if self.template else "Global"
        department_name = self.department.name if self.department else "All Departments"
        return f"{template_name} - {department_name} - {self.date}"


class FeedbackTrendRule(models.Model):
    """
    Модель для правил, по которым определяются отклонения в трендах
    """
    class RuleType(models.TextChoices):
        SENTIMENT_DROP = 'sentiment_drop', _('Sentiment Drop')
        SATISFACTION_DROP = 'satisfaction_drop', _('Satisfaction Drop')
        RESPONSE_RATE_DROP = 'response_rate_drop', _('Response Rate Drop')
        ISSUE_FREQUENCY_RISE = 'issue_frequency_rise', _(
            'Issue Frequency Rise')
        TOPIC_SHIFT = 'topic_shift', _('Topic Shift')

    name = models.CharField(_('name'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    rule_type = models.CharField(
        _('rule type'),
        max_length=50,
        choices=RuleType.choices
    )
    threshold = models.FloatField(_('threshold'))
    measurement_period_days = models.IntegerField(
        _('measurement period days'), default=7)
    is_active = models.BooleanField(_('is active'), default=True)

    # Опциональные ограничения по шаблонам и департаментам
    templates = models.ManyToManyField(
        FeedbackTemplate,
        related_name='trend_rules',
        verbose_name=_('templates'),
        blank=True
    )
    departments = models.ManyToManyField(
        'departments.Department',
        related_name='feedback_trend_rules',
        verbose_name=_('departments'),
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_trend_rules',
        null=True,
        blank=True,
        verbose_name=_('created by')
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('feedback trend rule')
        verbose_name_plural = _('feedback trend rules')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_rule_type_display()})"


class FeedbackTrendAlert(models.Model):
    """
    Модель для алертов по изменениям трендов обратной связи
    """
    class AlertSeverity(models.TextChoices):
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')
        CRITICAL = 'critical', _('Critical')

    rule = models.ForeignKey(
        FeedbackTrendRule,
        on_delete=models.CASCADE,
        related_name='alerts',
        verbose_name=_('rule')
    )
    template = models.ForeignKey(
        FeedbackTemplate,
        on_delete=models.SET_NULL,
        related_name='trend_alerts',
        verbose_name=_('template'),
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        related_name='feedback_trend_alerts',
        verbose_name=_('department'),
        null=True,
        blank=True
    )

    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'))
    severity = models.CharField(
        _('severity'),
        max_length=20,
        choices=AlertSeverity.choices,
        default=AlertSeverity.MEDIUM
    )
    previous_value = models.FloatField(
        _('previous value'), null=True, blank=True)
    current_value = models.FloatField(
        _('current value'), null=True, blank=True)
    percentage_change = models.FloatField(
        _('percentage change'), null=True, blank=True)

    is_resolved = models.BooleanField(_('is resolved'), default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='resolved_trend_alerts',
        null=True,
        blank=True,
        verbose_name=_('resolved by')
    )
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)
    resolution_comment = models.TextField(_('resolution comment'), blank=True)

    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('feedback trend alert')
        verbose_name_plural = _('feedback trend alerts')
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def resolve(self, user, comment=''):
        """
        Отметить алерт как разрешенный
        """
        self.is_resolved = True
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.resolution_comment = comment
        self.save()
