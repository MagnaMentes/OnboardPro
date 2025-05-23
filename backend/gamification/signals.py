from django.db.models.signals import post_save
from django.dispatch import receiver

from onboarding.models import UserStepProgress
from onboarding.lms_models import LMSUserTestResult
from onboarding.feedback_models import StepFeedback
from .services import GamificationService


@receiver(post_save, sender=UserStepProgress)
def handle_step_completion(sender, instance, **kwargs):
    """
    Обработка сигнала о завершении шага онбординга
    """
    # Проверяем, что шаг был отмечен как выполненный
    if instance.status == UserStepProgress.ProgressStatus.DONE:
        GamificationService.handle_step_completion(
            instance.user, instance.step)


@receiver(post_save, sender=LMSUserTestResult)
def handle_test_completion(sender, instance, **kwargs):
    """
    Обработка сигнала о завершении теста
    """
    GamificationService.handle_test_completion(instance.user, instance)


@receiver(post_save, sender=StepFeedback)
def handle_feedback_submission(sender, instance, created, **kwargs):
    """
    Обработка сигнала об отправке фидбека
    """
    if created:
        GamificationService.handle_feedback_submission(instance.user, instance)
