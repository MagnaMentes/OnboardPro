from django.db import models
from django.conf import settings
from onboarding.models import UserStepProgress


class AIChatMessage(models.Model):
    """
    Модель для хранения сообщений чата между пользователем и AI-ассистентом.
    """
    ROLE_CHOICES = (
        ('human', 'Human'),
        ('assistant', 'Assistant'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        verbose_name='Пользователь'
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='human',
        verbose_name='Роль'
    )
    message = models.TextField(verbose_name='Сообщение')
    step_progress = models.ForeignKey(
        UserStepProgress,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        null=True,
        blank=True,
        verbose_name='Шаг онбординга'
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['user', 'step_progress']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.role} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
