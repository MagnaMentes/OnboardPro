from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class NotificationType(models.TextChoices):
    """Перечисление типов уведомлений"""
    INFO = 'info', _('Information')
    WARNING = 'warning', _('Warning')
    DEADLINE = 'deadline', _('Deadline')
    SYSTEM = 'system', _('System')


class Notification(models.Model):
    """
    Модель уведомления
    """
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_('recipient')
    )
    title = models.CharField(_('title'), max_length=255)
    message = models.TextField(_('message'))
    notification_type = models.CharField(
        _('notification type'),
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.INFO
    )
    is_read = models.BooleanField(_('is read'), default=False)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    # Связь с другими моделями через ContentType (для StepFeedback и др.)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name=_('content type')
    )
    object_id = models.PositiveIntegerField(
        null=True, blank=True, verbose_name=_('object id'))
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        verbose_name = _('notification')
        verbose_name_plural = _('notifications')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.email} - {self.title}"

    def mark_as_read(self):
        """
        Отмечает уведомление как прочитанное
        """
        self.is_read = True
        self.save()
