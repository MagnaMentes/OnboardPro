from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from onboarding.models import OnboardingStep, UserStepProgress
import pytz


class ScheduledOnboardingStep(models.Model):
    """
    Модель запланированного шага онбординга
    """
    step_progress = models.OneToOneField(
        UserStepProgress,
        on_delete=models.CASCADE,
        related_name='scheduled_step',
        verbose_name=_('step progress')
    )
    scheduled_start_time = models.DateTimeField(
        _('scheduled start time'), null=True, blank=True)
    scheduled_end_time = models.DateTimeField(
        _('scheduled end time'), null=True, blank=True)
    last_rescheduled_at = models.DateTimeField(
        _('last rescheduled at'), auto_now=True)
    priority = models.IntegerField(
        _('priority'),
        default=1,
        help_text=_('Higher number means higher priority')
    )
    auto_scheduled = models.BooleanField(
        _('auto scheduled'),
        default=True,
        help_text=_('Whether this step was automatically scheduled')
    )
    time_zone = models.CharField(
        _('time zone'),
        max_length=50,
        default='UTC',
        help_text=_('Time zone for this scheduled step')
    )

    class Meta:
        verbose_name = _('scheduled onboarding step')
        verbose_name_plural = _('scheduled onboarding steps')
        ordering = ['scheduled_start_time']
        indexes = [
            models.Index(fields=['scheduled_start_time']),
            models.Index(fields=['scheduled_end_time']),
        ]

    def __str__(self):
        return f"{self.step_progress.step.name} - {self.scheduled_start_time}"

    def get_local_start_time(self):
        """Получить локальное время начала с учетом часового пояса"""
        if not self.scheduled_start_time:
            return None
        tz = pytz.timezone(self.time_zone)
        return self.scheduled_start_time.astimezone(tz)

    def get_local_end_time(self):
        """Получить локальное время окончания с учетом часового пояса"""
        if not self.scheduled_end_time:
            return None
        tz = pytz.timezone(self.time_zone)
        return self.scheduled_end_time.astimezone(tz)


class ScheduleConstraint(models.Model):
    """
    Модель ограничений для планирования
    """
    class ConstraintType(models.TextChoices):
        DEPENDENCY = 'dependency', _('Dependency')
        TIME_SLOT = 'time_slot', _('Time Slot Restriction')
        WORKLOAD = 'workload', _('Workload Limit')
        ROLE = 'role', _('Role Requirement')

    name = models.CharField(_('name'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    constraint_type = models.CharField(
        _('constraint type'),
        max_length=20,
        choices=ConstraintType.choices,
        default=ConstraintType.DEPENDENCY
    )
    # Для ограничений типа DEPENDENCY
    dependent_step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='dependencies',
        verbose_name=_('dependent step'),
        null=True, blank=True
    )
    prerequisite_step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='dependents',
        verbose_name=_('prerequisite step'),
        null=True, blank=True
    )
    # Для ограничений типа TIME_SLOT и WORKLOAD
    max_duration_minutes = models.PositiveIntegerField(
        _('maximum duration in minutes'),
        null=True, blank=True
    )
    max_concurrent_steps = models.PositiveIntegerField(
        _('maximum concurrent steps'),
        null=True, blank=True
    )
    # Для ограничений типа ROLE
    required_roles = models.JSONField(
        _('required roles'),
        default=list,
        help_text=_('List of roles required for this constraint'),
        null=True, blank=True
    )
    active = models.BooleanField(_('active'), default=True)

    class Meta:
        verbose_name = _('schedule constraint')
        verbose_name_plural = _('schedule constraints')
        ordering = ['name']

    def __str__(self):
        return self.name


class UserAvailability(models.Model):
    """
    Модель доступности пользователя для планирования
    """
    class AvailabilityType(models.TextChoices):
        WORKING_HOURS = 'working_hours', _('Regular Working Hours')
        VACATION = 'vacation', _('Vacation or Time Off')
        UNAVAILABLE = 'unavailable', _('Unavailable')
        PREFERRED = 'preferred', _('Preferred Time Slot')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='availabilities',
        verbose_name=_('user')
    )
    start_time = models.DateTimeField(_('start time'))
    end_time = models.DateTimeField(_('end time'))
    availability_type = models.CharField(
        _('availability type'),
        max_length=20,
        choices=AvailabilityType.choices,
        default=AvailabilityType.WORKING_HOURS
    )
    recurrence_rule = models.CharField(
        _('recurrence rule'),
        max_length=255,
        blank=True,
        help_text=_('iCalendar RFC-5545 recurrence rule')
    )
    time_zone = models.CharField(
        _('time zone'),
        max_length=50,
        default='UTC',
        help_text=_('Time zone for this availability')
    )

    class Meta:
        verbose_name = _('user availability')
        verbose_name_plural = _('user availabilities')
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['user', 'start_time', 'end_time']),
            models.Index(fields=['availability_type'])
        ]

    def __str__(self):
        return f"{self.user.email} - {self.get_availability_type_display()} ({self.start_time} - {self.end_time})"


class MentorLoad(models.Model):
    """
    Модель нагрузки на менторов
    """
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_loads',
        verbose_name=_('mentor')
    )
    max_weekly_hours = models.PositiveIntegerField(
        _('maximum weekly hours'),
        default=10
    )
    max_daily_sessions = models.PositiveIntegerField(
        _('maximum daily sessions'),
        default=3
    )
    current_weekly_hours = models.FloatField(
        _('current weekly hours'),
        default=0.0
    )
    current_daily_sessions = models.JSONField(
        _('current daily sessions'),
        default=dict,
        help_text=_(
            'JSON object with dates as keys and session counts as values')
    )
    specializations = models.JSONField(
        _('specializations'),
        default=list,
        help_text=_('List of specialization tags for matching with steps')
    )
    active = models.BooleanField(_('active'), default=True)

    class Meta:
        verbose_name = _('mentor load')
        verbose_name_plural = _('mentor loads')

    def __str__(self):
        return f"{self.mentor.email} - Load: {self.current_weekly_hours}/{self.max_weekly_hours} hours"

    def can_accommodate_session(self, date, duration_hours=1.0):
        """
        Проверяет, может ли ментор взять дополнительную сессию
        """
        iso_date = date.date().isoformat()

        # Проверка дневного лимита
        daily_sessions = self.current_daily_sessions.get(iso_date, 0)
        if daily_sessions >= self.max_daily_sessions:
            return False

        # Проверка недельного лимита
        # Предполагаем, что current_weekly_hours уже обновлено
        if self.current_weekly_hours + duration_hours > self.max_weekly_hours:
            return False

        return True


class CalendarEvent(models.Model):
    """
    Модель события календаря
    """
    class EventType(models.TextChoices):
        ONBOARDING_STEP = 'onboarding_step', _('Onboarding Step')
        MEETING = 'meeting', _('Meeting')
        TRAINING = 'training', _('Training')
        OTHER = 'other', _('Other')

    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    start_time = models.DateTimeField(_('start time'))
    end_time = models.DateTimeField(_('end time'))
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='calendar_events',
        verbose_name=_('participants')
    )
    event_type = models.CharField(
        _('event type'),
        max_length=20,
        choices=EventType.choices,
        default=EventType.ONBOARDING_STEP
    )
    location = models.CharField(_('location'), max_length=255, blank=True)
    virtual_meeting_link = models.URLField(
        _('virtual meeting link'), blank=True)
    scheduled_step = models.ForeignKey(
        ScheduledOnboardingStep,
        on_delete=models.SET_NULL,
        related_name='calendar_events',
        verbose_name=_('scheduled step'),
        null=True, blank=True
    )
    external_calendar_id = models.CharField(
        _('external calendar ID'),
        max_length=255,
        blank=True,
        help_text=_('ID in external calendar system (Google, Outlook)')
    )
    time_zone = models.CharField(
        _('time zone'),
        max_length=50,
        default='UTC',
        help_text=_('Time zone for this event')
    )
    is_all_day = models.BooleanField(_('is all day event'), default=False)
    reminder_minutes = models.IntegerField(
        _('reminder minutes'),
        default=15,
        help_text=_('Minutes before event to send reminder')
    )

    class Meta:
        verbose_name = _('calendar event')
        verbose_name_plural = _('calendar events')
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['start_time', 'end_time']),
            models.Index(fields=['event_type'])
        ]

    def __str__(self):
        return f"{self.title} ({self.start_time})"
