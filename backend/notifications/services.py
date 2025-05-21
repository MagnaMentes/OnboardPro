from django.utils.translation import gettext_lazy as _
from .models import Notification, NotificationType


class NotificationService:
    """
    Сервисный класс для работы с уведомлениями
    """

    @staticmethod
    def send_notification(recipient, title, message, notification_type=NotificationType.INFO):
        """
        Создает и сохраняет новое уведомление

        Args:
            recipient: Пользователь-получатель уведомления
            title: Заголовок уведомления
            message: Текст уведомления
            notification_type: Тип уведомления из NotificationType

        Returns:
            Notification: Созданное уведомление
        """
        notification = Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type
        )
        return notification

    @staticmethod
    def get_unread_notifications(user):
        """
        Возвращает непрочитанные уведомления пользователя

        Args:
            user: Пользователь

        Returns:
            QuerySet: Набор непрочитанных уведомлений
        """
        return Notification.objects.filter(recipient=user, is_read=False)

    @staticmethod
    def mark_all_as_read(user):
        """
        Отмечает все уведомления пользователя как прочитанные

        Args:
            user: Пользователь

        Returns:
            int: Количество обновленных уведомлений
        """
        return Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)

    @staticmethod
    def send_system_notification(recipient, title, message):
        """
        Отправляет системное уведомление
        """
        return NotificationService.send_notification(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=NotificationType.SYSTEM
        )

    @staticmethod
    def send_warning_notification(recipient, title, message):
        """
        Отправляет предупреждающее уведомление
        """
        return NotificationService.send_notification(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=NotificationType.WARNING
        )

    @staticmethod
    def send_deadline_notification(recipient, title, message):
        """
        Отправляет уведомление о дедлайне
        """
        return NotificationService.send_notification(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=NotificationType.DEADLINE
        )
