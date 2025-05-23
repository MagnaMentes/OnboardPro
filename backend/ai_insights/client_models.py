from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class ClientAIInsight(models.Model):
    """
    Модель для хранения AI-подсказок для конечных пользователей (сотрудников)
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_ai_insights',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        'onboarding.UserOnboardingAssignment',
        on_delete=models.CASCADE,
        related_name='client_ai_insights',
        verbose_name=_('assignment')
    )
    step = models.ForeignKey(
        'onboarding.OnboardingStep',
        on_delete=models.CASCADE,
        related_name='client_ai_insights',
        verbose_name=_('step')
    )
    hint_text = models.TextField(_('hint text'))
    generated_at = models.DateTimeField(
        _('generated at'), default=timezone.now)
    dismissed = models.BooleanField(_('dismissed'), default=False)

    class Meta:
        verbose_name = _('client AI insight')
        verbose_name_plural = _('client AI insights')
        ordering = ['-generated_at']
        unique_together = ['user', 'step', 'assignment']

    def __str__(self):
        return f"{self.user.email} - {self.step.name} - {'dismissed' if self.dismissed else 'active'}"
