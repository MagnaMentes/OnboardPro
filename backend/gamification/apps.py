from django.apps import AppConfig


class GamificationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gamification'
    verbose_name = 'Геймификация'

    def ready(self):
        # Импортируем обработчики сигналов
        import gamification.signals
