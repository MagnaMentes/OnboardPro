from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from departments.models import Department
from onboarding.models import OnboardingStep
from onboarding.lms_models import LMSTest, LMSQuestion


class AIInsightV2(models.Model):
    """
    Унифицированная модель для хранения AI-инсайтов
    Объединяет функционал предыдущих моделей AIInsight и TrainingInsight
    """
    class InsightType(models.TextChoices):
        # Общие типы инсайтов
        GENERAL = 'general', _('General')
        RISK = 'risk', _('Risk')

        # Инсайты по обучению
        DIFFICULT_STEP = 'difficult_step', _('Difficult Step')
        PROBLEMATIC_TEST = 'problematic_test', _('Problematic Test')
        STRUGGLING_USER = 'struggling_user', _('Struggling User')
        TIME_ANOMALY = 'time_anomaly', _('Time Anomaly')
        DEPARTMENT_PATTERN = 'department_pattern', _('Department Pattern')

    class RiskLevel(models.TextChoices):
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')
        CRITICAL = 'critical', _('Critical')

    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        ACKNOWLEDGED = 'acknowledged', _('Acknowledged')
        RESOLVED = 'resolved', _('Resolved')
        DISMISSED = 'dismissed', _('Dismissed')

    # Основные поля
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'))
    insight_type = models.CharField(
        _('insight type'),
        max_length=30,
        choices=InsightType.choices,
        default=InsightType.GENERAL
    )
    risk_level = models.CharField(
        _('risk level'),
        max_length=20,
        choices=RiskLevel.choices,
        default=RiskLevel.MEDIUM
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    severity = models.FloatField(
        _('severity'),
        default=0.0,
        help_text=_('Оценка серьезности проблемы от 0 до 1')
    )

    # Связи с другими моделями
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_insights_v2',
        verbose_name=_('user')
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name='ai_insights',
        verbose_name=_('department'),
        null=True,
        blank=True
    )
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.SET_NULL,
        related_name='ai_insights',
        verbose_name=_('step'),
        null=True,
        blank=True
    )
    test = models.ForeignKey(
        LMSTest,
        on_delete=models.SET_NULL,
        related_name='ai_insights',
        verbose_name=_('test'),
        null=True,
        blank=True
    )
    question = models.ForeignKey(
        LMSQuestion,
        on_delete=models.SET_NULL,
        related_name='ai_insights',
        verbose_name=_('question'),
        null=True,
        blank=True
    )

    # Метаданные
    metadata = models.JSONField(_('metadata'), default=dict, blank=True)
    tags = models.ManyToManyField(
        'InsightTag',
        related_name='insights',
        verbose_name=_('tags'),
        blank=True
    )

    # Временные метки
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)

    class Meta:
        verbose_name = _('AI insight')
        verbose_name_plural = _('AI insights')
        ordering = ['-created_at', '-severity']
        indexes = [
            models.Index(fields=['insight_type']),
            models.Index(fields=['risk_level']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"

    def resolve(self):
        """Отметить инсайт как разрешенный"""
        self.status = self.Status.RESOLVED
        self.resolved_at = timezone.now()
        self.save()

    def dismiss(self):
        """Отметить инсайт как отклоненный"""
        self.status = self.Status.DISMISSED
        self.save()

    def acknowledge(self):
        """Отметить инсайт как принятый к сведению"""
        self.status = self.Status.ACKNOWLEDGED
        self.save()


class InsightTag(models.Model):
    """
    Модель для тегов инсайтов, позволяющая группировать и категоризировать инсайты
    """
    class Category(models.TextChoices):
        GENERAL = 'general', _('General')
        TRAINING = 'training', _('Training')
        PERFORMANCE = 'performance', _('Performance')
        RISK = 'risk', _('Risk')

    name = models.CharField(_('name'), max_length=100)
    slug = models.SlugField(_('slug'), unique=True)
    description = models.TextField(_('description'), blank=True)
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL
    )
    color = models.CharField(_('color'), max_length=20, blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        related_name='children',
        verbose_name=_('parent tag'),
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('insight tag')
        verbose_name_plural = _('insight tags')
        ordering = ['category', 'name']

    def __str__(self):
        return self.name
