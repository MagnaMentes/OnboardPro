from django.apps import AppConfig


class SchedulerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'scheduler'
    verbose_name = 'Интеллектуальный планировщик'

    def ready(self):
        # Импорт сигналов при запуске приложения
        import scheduler.signals
