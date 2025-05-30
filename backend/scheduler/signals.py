from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from onboarding.models import UserStepProgress
from .models import ScheduledOnboardingStep


@receiver(post_save, sender=UserStepProgress)
def create_or_update_scheduled_step(sender, instance, created, **kwargs):
    """
    Сигнал для создания или обновления запланированного шага при обновлении UserStepProgress
    """
    from .services import SmartSchedulerEngine

    # Если статус шага обновился на выполненный, обновляем расписание
    if instance.status == UserStepProgress.ProgressStatus.DONE:
        # Возможно нужно перепланировать зависимые шаги
        SmartSchedulerEngine.reschedule_dependent_steps(instance)

    # Создаем или обновляем запланированный шаг
    if created:
        # Если это новый шаг прогресса, создаем соответствующий запланированный шаг
        scheduled_step = ScheduledOnboardingStep.objects.create(
            step_progress=instance,
            scheduled_start_time=instance.planned_date_start,
            scheduled_end_time=instance.planned_date_end
        )
    else:
        # Если это обновление существующего шага, также обновляем запланированный шаг
        scheduled_step, created = ScheduledOnboardingStep.objects.update_or_create(
            step_progress=instance,
            defaults={
                'scheduled_start_time': instance.planned_date_start,
                'scheduled_end_time': instance.planned_date_end,
            }
        )


@receiver(pre_delete, sender=UserStepProgress)
def delete_scheduled_step(sender, instance, **kwargs):
    """
    Сигнал для удаления запланированного шага при удалении UserStepProgress
    """
    # Пытаемся найти и удалить связанный запланированный шаг
    try:
        scheduled_step = ScheduledOnboardingStep.objects.get(
            step_progress=instance)
        scheduled_step.delete()
    except ScheduledOnboardingStep.DoesNotExist:
        pass
