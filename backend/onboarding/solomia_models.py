"""
Модели для AI-чата Solomia
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .models import UserStepProgress


class AIChatMessage(models.Model):
    """
    Модель для хранения сообщений в чате с AI-ассистентом Solomia
    """
    class Role(models.TextChoices):
        HUMAN = 'human', _('Human')
        ASSISTANT = 'assistant', _('Assistant')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_chat_messages',
        verbose_name=_('user')
    )
    role = models.CharField(
        _('role'),
        max_length=20,
        choices=Role.choices,
        default=Role.HUMAN
    )
    message = models.TextField(_('message'))
    step_progress = models.ForeignKey(
        UserStepProgress,
        on_delete=models.CASCADE,
        related_name='onboarding_chat_messages',
        verbose_name=_('step progress'),
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('AI chat message')
        verbose_name_plural = _('AI chat messages')
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['user', 'step_progress']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.get_role_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
