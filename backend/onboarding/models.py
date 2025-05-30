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
    is_virtual_meeting = models.BooleanField(
        _('is virtual meeting'), default=False)
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
    # Smart Scheduler fields
    planned_date_start = models.DateTimeField(
        _('planned start date'), null=True, blank=True)
    planned_date_end = models.DateTimeField(
        _('planned end date'), null=True, blank=True)
    actual_completed_at = models.DateTimeField(
        _('actual completion date'), null=True, blank=True)

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
        now = timezone.now()
        self.status = self.ProgressStatus.DONE
        self.completed_at = now
        self.actual_completed_at = now
        self.save()


class VirtualMeetingSlot(models.Model):
    """
    Модель для виртуальных встреч в процессе онбординга
    """
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='virtual_meeting_slots',
        verbose_name=_('step')
    )
    assigned_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='virtual_meetings',
        verbose_name=_('assigned user')
    )
    start_time = models.DateTimeField(_('start time'))
    end_time = models.DateTimeField(_('end time'))
    meeting_link = models.URLField(_('meeting link'), blank=True)

    class Meta:
        verbose_name = _('virtual meeting slot')
        verbose_name_plural = _('virtual meeting slots')
        ordering = ['start_time']
        # Проверка на пересечение временных слотов будет реализована на уровне сериализатора

    def __str__(self):
        return f"{self.step.name} - {self.assigned_user.email} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"


class AIHint(models.Model):
    """
    Модель для хранения AI-подсказок к шагам онбординга
    """
    assignment_step = models.ForeignKey(
        UserStepProgress,
        on_delete=models.CASCADE,
        related_name='ai_hints',
        verbose_name=_('assignment step')
    )
    generated_hint = models.TextField(_('generated hint'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('AI hint')
        verbose_name_plural = _('AI hints')
        ordering = ['-created_at']

    def __str__(self):
        return f"Hint for {self.assignment_step}"
