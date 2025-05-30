from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class RiskLevel(models.TextChoices):
    """Перечисление уровней риска для AI-инсайтов"""
    LOW = 'low', _('Low')
    MEDIUM = 'medium', _('Medium')
    HIGH = 'high', _('High')


class AIInsight(models.Model):
    """
    Модель для хранения AI-инсайтов по онбордингу сотрудников
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_insights',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        'onboarding.UserOnboardingAssignment',
        on_delete=models.CASCADE,
        related_name='ai_insights',
        verbose_name=_('assignment')
    )
    risk_level = models.CharField(
        _('risk level'),
        max_length=20,
        choices=RiskLevel.choices,
    )
    reason = models.TextField(_('reason'))
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('AI insight')
        verbose_name_plural = _('AI insights')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.assignment.program.name} - {self.get_risk_level_display()}"


class AIRecommendation(models.Model):
    """
    Модель для хранения персонализированных AI-рекомендаций.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_recommendations',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        'onboarding.UserOnboardingAssignment',
        on_delete=models.CASCADE,
        related_name='ai_recommendations',
        verbose_name=_('assignment')
    )
    step = models.ForeignKey(
        'onboarding.OnboardingStep',
        on_delete=models.CASCADE,
        related_name='ai_recommendations',
        verbose_name=_('step'),
        null=True,
        blank=True
    )
    recommendation_text = models.TextField(_('recommendation text'))
    generated_at = models.DateTimeField(
        _('generated at'), default=timezone.now)
    dismissed = models.BooleanField(_('dismissed'), default=False)

    class Meta:
        verbose_name = _('AI recommendation')
        verbose_name_plural = _('AI recommendations')
        ordering = ['-generated_at']

    def __str__(self):
        return f"Recommendation for {self.user.email} - {self.assignment.program.name}"
