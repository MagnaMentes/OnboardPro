from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        """
        Импортируем сигналы и запускаем фоновые задачи при старте приложения
        """
        import notifications.signals

        # Не запускаем задачи при выполнении manage.py
        import sys
        if 'runserver' in sys.argv:
            from notifications.tasks import start_deadline_check_task
            start_deadline_check_task()
