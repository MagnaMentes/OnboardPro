from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings

# Не импортируем модели обратной связи здесь, чтобы избежать циклических импортов
# Вместо этого они будут импортировать классы из models.py


class OnboardingProgram(models.Model):
    """
    Модель онбординг-программы
    """
    name = models.CharField(_('name'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_programs',
        verbose_name=_('author')
    )

    class Meta:
        verbose_name = _('onboarding program')
        verbose_name_plural = _('onboarding programs')
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class OnboardingStep(models.Model):
    """
    Модель шага онбординг-программы
    """
    class StepType(models.TextChoices):
        TASK = 'task', _('Task')
        MEETING = 'meeting', _('Meeting')
        TRAINING = 'training', _('Training')

    name = models.CharField(_('name'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    step_type = models.CharField(
        _('step type'),
        max_length=20,
        choices=StepType.choices,
        default=StepType.TASK
    )
    order = models.PositiveIntegerField(_('order'))
    program = models.ForeignKey(
        OnboardingProgram,
        on_delete=models.CASCADE,
        related_name='steps',
        verbose_name=_('program')
    )
    is_required = models.BooleanField(_('is required'), default=True)
    deadline_days = models.PositiveIntegerField(
        _('deadline days'),
        null=True,
        blank=True,
        help_text=_('Number of days to complete after assignment')
    )

    class Meta:
        verbose_name = _('onboarding step')
        verbose_name_plural = _('onboarding steps')
        ordering = ['program', 'order']
        unique_together = ['program', 'order']

    def __str__(self):
        return f"{self.program.name} - {self.name}"


class UserOnboardingAssignment(models.Model):
    """
    Модель назначения онбординг-программы пользователю
    """
    class AssignmentStatus(models.TextChoices):
        ACTIVE = 'active', _('Active')
        COMPLETED = 'completed', _('Completed')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='onboarding_assignments',
        verbose_name=_('user')
    )
    program = models.ForeignKey(
        OnboardingProgram,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name=_('program')
    )
    assigned_at = models.DateTimeField(_('assigned at'), default=timezone.now)
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=AssignmentStatus.choices,
        default=AssignmentStatus.ACTIVE
    )

    class Meta:
        verbose_name = _('user onboarding assignment')
        verbose_name_plural = _('user onboarding assignments')
        ordering = ['-assigned_at']
        unique_together = ['user', 'program']

    def __str__(self):
        return f"{self.user.email} - {self.program.name}"


class UserStepProgress(models.Model):
    """
    Модель прогресса пользователя по шагам онбординга
    """
    class ProgressStatus(models.TextChoices):
        NOT_STARTED = 'not_started', _('Not Started')
        IN_PROGRESS = 'in_progress', _('In Progress')
        DONE = 'done', _('Done')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='step_progress',
        verbose_name=_('user')
    )
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='user_progress',
        verbose_name=_('step')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=ProgressStatus.choices,
        default=ProgressStatus.NOT_STARTED
    )
    completed_at = models.DateTimeField(
        _('completed at'), null=True, blank=True)

    class Meta:
        verbose_name = _('user step progress')
        verbose_name_plural = _('user step progress')
        ordering = ['step__order']
        unique_together = ['user', 'step']

    def __str__(self):
        return f"{self.user.email} - {self.step.name} - {self.get_status_display()}"

    def mark_as_done(self):
        """
        Отмечает шаг как выполненный и устанавливает дату завершения
        """
        self.status = self.ProgressStatus.DONE
        self.completed_at = timezone.now()
        self.save()
