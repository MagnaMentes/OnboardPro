from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from onboarding.models import OnboardingStep, UserOnboardingAssignment
from .insights_models import InsightTag

User = settings.AUTH_USER_MODEL


class AIRecommendationV2(models.Model):
    """
    Модель для хранения персонализированных AI-рекомендаций версии 2.0.
    Поддерживает разные сценарии, теги и причины, а также отклонение/принятие рекомендации.
    """
    class RecommendationType(models.TextChoices):
        TRAINING = 'training', _('Training')
        FEEDBACK = 'feedback', _('Feedback')
        PROGRESS = 'progress', _('Progress')
        GENERAL = 'general', _('General')

    class RecommendationStatus(models.TextChoices):
        ACTIVE = 'active', _('Active')
        ACCEPTED = 'accepted', _('Accepted')
        REJECTED = 'rejected', _('Rejected')
        EXPIRED = 'expired', _('Expired')

    class RecommendationPriority(models.TextChoices):
        HIGH = 'high', _('High')
        MEDIUM = 'medium', _('Medium')
        LOW = 'low', _('Low')

    # Основные поля
    title = models.CharField(_('title'), max_length=255)
    recommendation_text = models.TextField(_('recommendation text'))

    # Тип и статус
    recommendation_type = models.CharField(
        _('recommendation type'),
        max_length=30,
        choices=RecommendationType.choices,
        default=RecommendationType.GENERAL
    )
    priority = models.CharField(
        _('priority'),
        max_length=20,
        choices=RecommendationPriority.choices,
        default=RecommendationPriority.MEDIUM
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=RecommendationStatus.choices,
        default=RecommendationStatus.ACTIVE
    )

    # Причины и обоснования
    reason = models.TextField(_('reason'), blank=True, null=True)
    impact_description = models.TextField(
        _('impact description'), blank=True, null=True)

    # Теги
    tags = models.ManyToManyField(
        InsightTag,
        related_name='recommendations',
        verbose_name=_('tags'),
        blank=True
    )

    # Временные метки
    generated_at = models.DateTimeField(
        _('generated at'), default=timezone.now)
    expires_at = models.DateTimeField(_('expires at'), blank=True, null=True)
    resolved_at = models.DateTimeField(_('resolved at'), blank=True, null=True)

    # Связи с другими моделями
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ai_recommendations_v2',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        UserOnboardingAssignment,
        on_delete=models.CASCADE,
        related_name='ai_recommendations_v2',
        verbose_name=_('assignment')
    )
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='ai_recommendations_v2',
        verbose_name=_('step'),
        null=True,
        blank=True
    )

    # Связь с инсайтом
    insight = models.ForeignKey(
        'AIInsight',
        on_delete=models.SET_NULL,
        related_name='recommendations',
        verbose_name=_('insight'),
        null=True,
        blank=True
    )

    # Информация об обработке рекомендации
    accepted_reason = models.TextField(
        _('accepted reason'), blank=True, null=True)
    rejected_reason = models.TextField(
        _('rejected reason'), blank=True, null=True)
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='processed_recommendations',
        verbose_name=_('processed by'),
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = _('AI recommendation v2')
        verbose_name_plural = _('AI recommendations v2')
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.get_recommendation_type_display()}: {self.title}"

    def accept(self, reason=None, user=None):
        """
        Принимает рекомендацию
        """
        self.status = self.RecommendationStatus.ACCEPTED
        self.accepted_reason = reason
        self.processed_by = user
        self.resolved_at = timezone.now()
        self.save(update_fields=[
            'status', 'accepted_reason', 'processed_by', 'resolved_at'])

    def reject(self, reason=None, user=None):
        """
        Отклоняет рекомендацию
        """
        self.status = self.RecommendationStatus.REJECTED
        self.rejected_reason = reason
        self.processed_by = user
        self.resolved_at = timezone.now()
        self.save(update_fields=[
            'status', 'rejected_reason', 'processed_by', 'resolved_at'])
