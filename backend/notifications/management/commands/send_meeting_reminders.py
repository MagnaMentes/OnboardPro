from django.core.management.base import BaseCommand
from notifications.email_services import EmailNotificationService


class Command(BaseCommand):
    """
    Команда для отправки напоминаний о встречах, которые состоятся через 24 часа

    Использование:
    python manage.py send_meeting_reminders

    Рекомендуется запускать ежедневно через планировщик задач (cron, celery и т.д.)
    """
    help = 'Отправляет напоминания о встречах, которые состоятся через 24 часа'

    def handle(self, *args, **options):
        count = EmailNotificationService.send_upcoming_meetings_reminders()
        self.stdout.write(
            self.style.SUCCESS(
                f'Отправлено {count} напоминаний о предстоящих встречах')
        )
