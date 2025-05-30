from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    ScheduledOnboardingStep, ScheduleConstraint, UserAvailability,
    MentorLoad, CalendarEvent
)


@admin.register(ScheduledOnboardingStep)
class ScheduledOnboardingStepAdmin(admin.ModelAdmin):
    """Админ-панель для запланированных шагов онбординга"""
    list_display = [
        'id', 'get_step_name', 'get_user', 'scheduled_start_time',
        'scheduled_end_time', 'priority', 'auto_scheduled', 'last_rescheduled_at'
    ]
    list_filter = ['auto_scheduled', 'priority',
                   'time_zone', 'step_progress__step__step_type']
    search_fields = [
        'step_progress__step__name', 'step_progress__user__email',
        'step_progress__user__full_name', 'step_progress__user__username'
    ]
    readonly_fields = ['last_rescheduled_at']
    autocomplete_fields = ['step_progress']

    def get_step_name(self, obj):
        return obj.step_progress.step.name
    get_step_name.short_description = _('Step')
    get_step_name.admin_order_field = 'step_progress__step__name'

    def get_user(self, obj):
        user = obj.step_progress.user
        url = reverse('admin:users_user_change', args=[user.id])
        return format_html('<a href="{}">{}</a>', url, user.email)
    get_user.short_description = _('User')
    get_user.admin_order_field = 'step_progress__user__email'


@admin.register(ScheduleConstraint)
class ScheduleConstraintAdmin(admin.ModelAdmin):
    """Админ-панель для ограничений расписания"""
    list_display = [
        'name', 'constraint_type', 'get_dependent_step', 'get_prerequisite_step',
        'max_duration_minutes', 'max_concurrent_steps', 'active'
    ]
    list_filter = ['constraint_type', 'active']
    search_fields = ['name', 'description',
                     'dependent_step__name', 'prerequisite_step__name']

    def get_dependent_step(self, obj):
        if obj.dependent_step:
            return obj.dependent_step.name
        return '-'
    get_dependent_step.short_description = _('Dependent Step')
    get_dependent_step.admin_order_field = 'dependent_step__name'

    def get_prerequisite_step(self, obj):
        if obj.prerequisite_step:
            return obj.prerequisite_step.name
        return '-'
    get_prerequisite_step.short_description = _('Prerequisite Step')
    get_prerequisite_step.admin_order_field = 'prerequisite_step__name'


@admin.register(UserAvailability)
class UserAvailabilityAdmin(admin.ModelAdmin):
    """Админ-панель для доступности пользователей"""
    list_display = [
        'get_user_email', 'availability_type', 'start_time', 'end_time',
        'recurrence_rule', 'time_zone'
    ]
    list_filter = ['availability_type', 'time_zone']
    search_fields = ['user__email', 'user__full_name', 'recurrence_rule']
    autocomplete_fields = ['user']

    def get_user_email(self, obj):
        return obj.user.email
    get_user_email.short_description = _('User')
    get_user_email.admin_order_field = 'user__email'


@admin.register(MentorLoad)
class MentorLoadAdmin(admin.ModelAdmin):
    """Админ-панель для нагрузки на менторов"""
    list_display = [
        'get_mentor_name', 'max_weekly_hours', 'current_weekly_hours',
        'max_daily_sessions', 'get_specializations', 'active'
    ]
    list_filter = ['active']
    search_fields = ['mentor__email', 'mentor__full_name', 'specializations']
    autocomplete_fields = ['mentor']

    def get_mentor_name(self, obj):
        return f"{obj.mentor.get_full_name()} ({obj.mentor.email})"
    get_mentor_name.short_description = _('Mentor')
    get_mentor_name.admin_order_field = 'mentor__email'

    def get_specializations(self, obj):
        return ", ".join(obj.specializations) if obj.specializations else "-"
    get_specializations.short_description = _('Specializations')


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    """Админ-панель для событий календаря"""
    list_display = [
        'title', 'event_type', 'start_time', 'end_time', 'location',
        'get_participants_count', 'is_all_day', 'time_zone'
    ]
    list_filter = ['event_type', 'time_zone', 'is_all_day']
    search_fields = ['title', 'description', 'participants__email', 'location']
    filter_horizontal = ['participants']

    def get_participants_count(self, obj):
        count = obj.participants.count()
        return f"{count} {'participant' if count == 1 else 'participants'}"
    get_participants_count.short_description = _('Participants')
