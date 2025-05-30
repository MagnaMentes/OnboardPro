from django.apps import AppConfig


class FeedbackConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'feedback'
    verbose_name = 'Smart Feedback Loop'

    def ready(self):
        try:
            import feedback.signals
        except ImportError:
            pass
