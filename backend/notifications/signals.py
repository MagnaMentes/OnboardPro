from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from onboarding.models import UserOnboardingAssignment, UserStepProgress
from .models import Notification, NotificationType


@receiver(post_save, sender=UserOnboardingAssignment)
def handle_new_onboarding_assignment(sender, instance, created, **kwargs):
    """
    Создает уведомление при назначении новой программы онбординга пользователю
    """
    if created:
        # Уведомляем сотрудника о назначении новой программы
        Notification.objects.create(
            recipient=instance.user,
            title=_('New onboarding program assigned'),
            message=_(
                f'You have been assigned to the onboarding program "{instance.program.name}".'),
            notification_type=NotificationType.INFO
        )


@receiver(post_save, sender=UserStepProgress)
def handle_step_progress_change(sender, instance, created, **kwargs):
    """
    Обрабатывает изменение статуса прогресса шага
    """
    if created:
        # Новое назначение шага - не делаем ничего
        return

    # Если шаг выполнен, уведомляем HR о завершении
    if instance.status == UserStepProgress.ProgressStatus.DONE:
        # Находим HR или менеджеров, которым нужно отправить уведомление
        # В реальном проекте здесь была бы логика выбора конкретного HR или менеджера
        from users.models import User, UserRole
        hr_managers = User.objects.filter(
            role__in=[UserRole.HR, UserRole.MANAGER])

        for hr in hr_managers:
            Notification.objects.create(
                recipient=hr,
                title=_('Step completed'),
                message=_(
                    f'Employee {instance.user.get_full_name()} completed the step "{instance.step.name}" in program "{instance.step.program.name}".'),
                notification_type=NotificationType.INFO
            )


def check_approaching_deadlines():
    """
    Проверяет приближающиеся дедлайны и создает соответствующие уведомления
    Эта функция будет вызываться из задачи в фоне
    """
    from onboarding.models import UserStepProgress

    # Получаем все активные шаги, которые не завершены
    active_steps = UserStepProgress.objects.filter(
        status__in=[
            UserStepProgress.ProgressStatus.NOT_STARTED,
            UserStepProgress.ProgressStatus.IN_PROGRESS
        ]
    )

    now = timezone.now()

    for step_progress in active_steps:
        # Проверяем наличие запланированной даты окончания
        if step_progress.planned_date_end:
            deadline = step_progress.planned_date_end

            # Если до дедлайна осталось менее 24 часов
            if now + timezone.timedelta(hours=24) >= deadline and now < deadline:
                # Создаем уведомление о приближающемся дедлайне
                Notification.objects.create(
                    recipient=step_progress.user,
                    title=_('Deadline approaching'),
                    message=_(
                        f'You have less than 24 hours to complete the step "{step_progress.step.name}" in program "{step_progress.step.program.name}".'),
                    notification_type=NotificationType.DEADLINE
                )

            # Если дедлайн пропущен, уведомляем HR/менеджера
            elif now > deadline and not step_progress.completed_at:
                # Находим HR/менеджеров
                from users.models import User, UserRole
                hr_managers = User.objects.filter(
                    role__in=[UserRole.HR, UserRole.MANAGER])

                for hr in hr_managers:
                    Notification.objects.create(
                        recipient=hr,
                        title=_('Deadline missed'),
                        message=_(
                            f'Employee {step_progress.user.get_full_name()} missed the deadline for step "{step_progress.step.name}" in program "{step_progress.step.program.name}".'),
                        notification_type=NotificationType.WARNING
                    )


def notify_on_test_failure(user, step):
    """
    Создает уведомления при провале теста

    Эта функция будет вызываться из бизнес-логики обработки тестов
    """
    # Уведомление для сотрудника
    Notification.objects.create(
        recipient=user,
        title=_('Test failed'),
        message=_(
            f'You did not pass the test for step "{step.name}" in program "{step.program.name}". Please try again.'),
        notification_type=NotificationType.WARNING
    )

    # Уведомление для HR/менеджеров
    from users.models import User, UserRole
    hr_managers = User.objects.filter(role__in=[UserRole.HR, UserRole.MANAGER])

    for hr in hr_managers:
        Notification.objects.create(
            recipient=hr,
            title=_('Test failed'),
            message=_(
                f'Employee {user.get_full_name()} failed the test for step "{step.name}" in program "{step.program.name}".'),
            notification_type=NotificationType.WARNING
        )
