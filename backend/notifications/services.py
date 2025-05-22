from django.utils.translation import gettext_lazy as _
from .models import Notification, NotificationType


class NotificationService:
    """
    Сервисный класс для работы с уведомлениями
    """

    @staticmethod
    def send_notification(recipient, title, message, notification_type=NotificationType.INFO, content_object=None):
        """
        Создает и сохраняет новое уведомление

        Args:
            recipient: Пользователь-получатель уведомления
            title: Заголовок уведомления
            message: Текст уведомления
            notification_type: Тип уведомления из NotificationType
            content_object: Связанный объект (например, StepFeedback)

        Returns:
            Notification: Созданное уведомление
        """
        notification = Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type
        )

        # Если передан связанный объект, добавляем связь
        if content_object:
            notification.content_object = content_object
            notification.save()

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

    @staticmethod
    def get_notifications_by_content_object(content_type, object_id):
        """
        Возвращает уведомления, связанные с указанным объектом

        Args:
            content_type: ContentType объект связанной модели
            object_id: ID связанного объекта

        Returns:
            QuerySet: Набор уведомлений, связанных с объектом
        """
        return Notification.objects.filter(
            content_type=content_type,
            object_id=object_id
        )
