from django.apps import AppConfig


class OnboardingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'onboarding'
    label = 'onboarding'
    verbose_name = 'Onboarding Programs'

    def ready(self):
        import onboarding.lms_models  # Регистрация моделей LMS
        import onboarding.solomia_models  # Регистрация моделей Solomia
