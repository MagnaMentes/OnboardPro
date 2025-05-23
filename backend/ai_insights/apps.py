from django.apps import AppConfig


class AIInsightsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_insights'
    verbose_name = 'AI Analytics & Insights'

    def ready(self):
        import ai_insights.signals
