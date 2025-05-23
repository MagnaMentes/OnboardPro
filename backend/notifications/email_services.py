import logging
import os
import smtplib
from datetime import timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import send_mail
from onboarding.models import VirtualMeetingSlot


logger = logging.getLogger(__name__)


class EmailNotificationService:
    """
    Сервис для отправки email-уведомлений о виртуальных встречах

    Функциональные возможности:
    - Отправка письма при назначении новой встречи
    - Отправка напоминаний за 24 часа до встречи
    - Использование SMTP-конфигурации из настроек окружения
    - Поддержка HTML-шаблонов для писем
    """

    @classmethod
    def send_new_meeting_notification(cls, meeting_slot: VirtualMeetingSlot):
        """
        Отправляет уведомление о новой запланированной встрече

        Args:
            meeting_slot (VirtualMeetingSlot): объект виртуальной встречи
        """
        if not cls._check_notifications_enabled(meeting_slot.assigned_user):
            return False

        subject = f"Новая виртуальная встреча: {meeting_slot.step.name}"

        context = {
            'user_name': meeting_slot.assigned_user.get_full_name(),
            'step_name': meeting_slot.step.name,
            'start_time': meeting_slot.start_time,
            'end_time': meeting_slot.end_time,
            'meeting_link': meeting_slot.meeting_link if meeting_slot.meeting_link else "Ссылка будет добавлена позже",
            'is_reminder': False
        }

        return cls._send_email_notification(
            subject=subject,
            recipient_email=meeting_slot.assigned_user.email,
            meeting_slot=meeting_slot,
            context=context
        )

    @classmethod
    def send_meeting_reminder(cls, meeting_slot: VirtualMeetingSlot):
        """
        Отправляет напоминание о встрече за 24 часа

        Args:
            meeting_slot (VirtualMeetingSlot): объект виртуальной встречи
        """
        if not cls._check_notifications_enabled(meeting_slot.assigned_user):
            return False

        subject = f"Напоминание: Виртуальная встреча {meeting_slot.step.name} завтра"

        context = {
            'user_name': meeting_slot.assigned_user.get_full_name(),
            'step_name': meeting_slot.step.name,
            'start_time': meeting_slot.start_time,
            'end_time': meeting_slot.end_time,
            'meeting_link': meeting_slot.meeting_link if meeting_slot.meeting_link else "Ссылка отсутствует",
            'is_reminder': True
        }

        return cls._send_email_notification(
            subject=subject,
            recipient_email=meeting_slot.assigned_user.email,
            meeting_slot=meeting_slot,
            context=context
        )

    @classmethod
    def send_upcoming_meetings_reminders(cls):
        """
        Отправляет напоминания о встречах, которые состоятся через 24 часа
        Метод для использования планировщиком задач
        """
        now = timezone.now()
        target_time = now + timedelta(hours=24)

        # Получаем встречи, которые начнутся через 23-25 часов
        upcoming_meetings = VirtualMeetingSlot.objects.filter(
            start_time__gte=target_time - timedelta(hours=1),
            start_time__lte=target_time + timedelta(hours=1)
        )

        for meeting in upcoming_meetings:
            cls.send_meeting_reminder(meeting)

        return len(upcoming_meetings)

    @classmethod
    def _check_notifications_enabled(cls, user):
        """
        Проверяет, включены ли уведомления у пользователя

        Args:
            user: объект пользователя

        Returns:
            bool: True если уведомления включены, иначе False
        """
        # Проверка наличия поля notifications_enabled
        if hasattr(user, 'notifications_enabled'):
            return user.notifications_enabled
        return True  # По умолчанию включено

    @classmethod
    def _send_email_notification(cls, subject, recipient_email, meeting_slot, context):
        """
        Отправляет электронное письмо с помощью настроенного SMTP или логирует в консоль

        Args:
            subject (str): тема письма
            recipient_email (str): email получателя
            meeting_slot (VirtualMeetingSlot): объект встречи
            context (dict): контекст для шаблона

        Returns:
            bool: True при успешной отправке, False при ошибке
        """
        try:
            # Рендеринг HTML шаблона
            html_message = render_to_string(
                'email/meeting_notification.html', context)

            # Создаем простую текстовую версию для клиентов без поддержки HTML
            text_content = f"""
            {context['user_name']}, {'напоминаем о' if context['is_reminder'] else 'назначена'} виртуальной встрече:
            
            Название: {context['step_name']}
            Время: {context['start_time'].strftime('%d.%m.%Y %H:%M')} - {context['end_time'].strftime('%H:%M')}
            Ссылка: {context['meeting_link']}
            
            С уважением, команда OnboardPro
            """

            # Проверяем наличие SMTP настроек
            if hasattr(settings, 'EMAIL_HOST') and settings.EMAIL_HOST:
                send_mail(
                    subject=subject,
                    message=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient_email],
                    html_message=html_message,
                    fail_silently=False,
                )
                logger.info(
                    f"Отправлено письмо о встрече на {recipient_email}")
            else:
                # Если настройки SMTP отсутствуют, выводим в лог
                logger.info(
                    f"[EMAIL NOT SENT - LOGGING ONLY] To: {recipient_email} | Subject: {subject}")
                logger.info(f"Content: {text_content}")

            return True
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления о встрече: {str(e)}")
            return False
