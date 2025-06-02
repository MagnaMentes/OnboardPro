from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from departments.models import Department
from onboarding.models import OnboardingStep, UserOnboardingAssignment

User = settings.AUTH_USER_MODEL


class InsightTag(models.Model):
    """
    Модель для хранения тегов инсайтов
    """
    name = models.CharField(_('name'), max_length=100)
    slug = models.SlugField(_('slug'), max_length=100, unique=True)
    description = models.TextField(_('description'), blank=True, null=True)
    color = models.CharField(_('color'), max_length=20, default='blue')
    category = models.CharField(
        _('category'), max_length=50, blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        related_name='children_tags',
        verbose_name=_('parent tag'),
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('insight tag')
        verbose_name_plural = _('insight tags')
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_full_category_path(self):
        """
        Возвращает полный путь категории (с родительскими тегами)
        """
        path = [self.name]
        parent = self.parent

        while parent:
            path.insert(0, parent.name)
            parent = parent.parent

        return " > ".join(path)


class AIInsightV2(models.Model):
    """
    Модель для Smart Insights Hub - централизованная модель инсайтов
    """
    class InsightType(models.TextChoices):
        TRAINING = 'training', _('Training')
        FEEDBACK = 'feedback', _('Feedback')
        SCHEDULE = 'schedule', _('Schedule')
        ANALYTICS = 'analytics', _('Analytics')
        RECOMMENDATION = 'recommendation', _('Recommendation')

    class InsightStatus(models.TextChoices):
        NEW = 'new', _('New')
        ACKNOWLEDGED = 'acknowledged', _('Acknowledged')
        IN_PROGRESS = 'in_progress', _('In Progress')
        RESOLVED = 'resolved', _('Resolved')
        DISMISSED = 'dismissed', _('Dismissed')

    class InsightLevel(models.TextChoices):
        CRITICAL = 'critical', _('Critical')
        HIGH = 'high', _('High')
        MEDIUM = 'medium', _('Medium')
        LOW = 'low', _('Low')
        INFORMATIONAL = 'informational', _('Informational')

    # Основные поля
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'))

    # Тип и уровень важности
    insight_type = models.CharField(
        _('insight type'),
        max_length=30,
        choices=InsightType.choices
    )
    level = models.CharField(
        _('level'),
        max_length=20,
        choices=InsightLevel.choices,
        default=InsightLevel.MEDIUM
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=InsightStatus.choices,
        default=InsightStatus.NEW
    )

    # Источник инсайта и метаданные
    source = models.CharField(_('source'), max_length=100, default='system')
    source_id = models.CharField(
        _('source ID'), max_length=100, blank=True, null=True)
    metadata = models.JSONField(_('metadata'), default=dict, blank=True)

    # Теги и категоризация
    tags = models.ManyToManyField(
        InsightTag,
        related_name='insights',
        verbose_name=_('tags'),
        blank=True
    )

    # Временные метки
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)

    # Связи с другими моделями
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ai_insights_v2',
        verbose_name=_('user'),
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name='ai_insights_v2',
        verbose_name=_('department'),
        null=True,
        blank=True
    )
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.SET_NULL,
        related_name='ai_insights_v2',
        verbose_name=_('step'),
        null=True,
        blank=True
    )
    assignment = models.ForeignKey(
        UserOnboardingAssignment,
        on_delete=models.SET_NULL,
        related_name='ai_insights_v2',
        verbose_name=_('assignment'),
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = _('AI insight')
        verbose_name_plural = _('AI insights')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"

    def resolve(self):
        """
        Отмечает инсайт как разрешенный
        """
        self.status = self.InsightStatus.RESOLVED
        self.resolved_at = timezone.now()
        self.save(update_fields=['status', 'resolved_at'])

    def dismiss(self):
        """
        Отмечает инсайт как отклоненный
        """
        self.status = self.InsightStatus.DISMISSED
        self.save(update_fields=['status'])

    def acknowledge(self):
        """
        Отмечает инсайт как подтвержденный
        """
        self.status = self.InsightStatus.ACKNOWLEDGED
        self.save(update_fields=['status'])

    def mark_in_progress(self):
        """
        Отмечает инсайт как находящийся в обработке
        """
        self.status = self.InsightStatus.IN_PROGRESS
        self.save(update_fields=['status'])
