from django.db.models.signals import post_save
from django.dispatch import receiver
from onboarding.feedback_models import FeedbackMood, StepFeedback
from onboarding.models import UserStepProgress
from .services import AIInsightService


@receiver(post_save, sender=FeedbackMood)
def analyze_after_mood_update(sender, instance, created, **kwargs):
    """
    Выполняет анализ после создания/обновления настроения
    """
    if created or kwargs.get("update_fields"):
        AIInsightService.analyze_onboarding_progress(instance.assignment)


@receiver(post_save, sender=StepFeedback)
def analyze_after_feedback_update(sender, instance, created, **kwargs):
    """
    Выполняет анализ после создания/обновления отзыва о шаге
    """
    if created or kwargs.get("update_fields"):
        AIInsightService.analyze_onboarding_progress(instance.assignment)


@receiver(post_save, sender=UserStepProgress)
def analyze_after_step_progress_update(sender, instance, created, **kwargs):
    """
    Выполняет анализ после обновления прогресса по шагу
    """
    if not created and kwargs.get("update_fields"):
        # Получаем задание онбординга
        from onboarding.models import UserOnboardingAssignment
        assignments = UserOnboardingAssignment.objects.filter(
            user=instance.user,
            program=instance.step.program
        )
        if assignments.exists():
            AIInsightService.analyze_onboarding_progress(assignments.first())
