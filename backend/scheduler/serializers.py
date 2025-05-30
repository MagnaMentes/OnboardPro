from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import (
    ScheduledOnboardingStep, ScheduleConstraint, UserAvailability,
    MentorLoad, CalendarEvent
)
from onboarding.models import OnboardingStep, UserStepProgress
from users.serializers import UserMinimalSerializer


class ScheduledOnboardingStepSerializer(serializers.ModelSerializer):
    """Сериализатор для запланированных шагов онбординга"""
    step_name = serializers.CharField(
        source='step_progress.step.name', read_only=True)
    step_type = serializers.CharField(
        source='step_progress.step.step_type', read_only=True)
    user = UserMinimalSerializer(source='step_progress.user', read_only=True)
    step_status = serializers.CharField(
        source='step_progress.status', read_only=True)

    class Meta:
        model = ScheduledOnboardingStep
        fields = [
            'id', 'step_progress', 'scheduled_start_time', 'scheduled_end_time',
            'last_rescheduled_at', 'priority', 'auto_scheduled', 'time_zone',
            'step_name', 'step_type', 'user', 'step_status'
        ]
        read_only_fields = ['last_rescheduled_at', 'auto_scheduled']


class ScheduleConstraintSerializer(serializers.ModelSerializer):
    """Сериализатор для ограничений расписания"""
    dependent_step_name = serializers.CharField(
        source='dependent_step.name', read_only=True)
    prerequisite_step_name = serializers.CharField(
        source='prerequisite_step.name', read_only=True)

    class Meta:
        model = ScheduleConstraint
        fields = [
            'id', 'name', 'description', 'constraint_type',
            'dependent_step', 'dependent_step_name',
            'prerequisite_step', 'prerequisite_step_name',
            'max_duration_minutes', 'max_concurrent_steps',
            'required_roles', 'active'
        ]


class UserAvailabilitySerializer(serializers.ModelSerializer):
    """Сериализатор для доступности пользователя"""
    user_name = serializers.CharField(
        source='user.get_full_name', read_only=True)

    class Meta:
        model = UserAvailability
        fields = [
            'id', 'user', 'user_name', 'start_time', 'end_time',
            'availability_type', 'recurrence_rule', 'time_zone'
        ]


class MentorLoadSerializer(serializers.ModelSerializer):
    """Сериализатор для нагрузки на менторов"""
    mentor_name = serializers.CharField(
        source='mentor.get_full_name', read_only=True)

    class Meta:
        model = MentorLoad
        fields = [
            'id', 'mentor', 'mentor_name', 'max_weekly_hours', 'max_daily_sessions',
            'current_weekly_hours', 'current_daily_sessions', 'specializations', 'active'
        ]


class CalendarEventSerializer(serializers.ModelSerializer):
    """Сериализатор для событий календаря"""
    participants_data = UserMinimalSerializer(
        source='participants', many=True, read_only=True)

    class Meta:
        model = CalendarEvent
        fields = [
            'id', 'title', 'description', 'start_time', 'end_time',
            'participants', 'participants_data', 'event_type', 'location',
            'virtual_meeting_link', 'scheduled_step', 'external_calendar_id',
            'time_zone', 'is_all_day', 'reminder_minutes'
        ]


class SchedulePlanningSerializer(serializers.Serializer):
    """Сериализатор для запуска планирования"""
    assignment_id = serializers.IntegerField()


class ScheduleOverrideSerializer(serializers.Serializer):
    """Сериализатор для ручной корректировки расписания"""
    scheduled_step_id = serializers.IntegerField()
    new_start_time = serializers.DateTimeField()
    new_end_time = serializers.DateTimeField()

    def validate(self, data):
        """Проверка валидности временного интервала"""
        if data['new_end_time'] <= data['new_start_time']:
            raise serializers.ValidationError(
                _("End time must be after start time.")
            )
        return data


class ConflictsSerializer(serializers.Serializer):
    """Сериализатор для вывода конфликтов в расписании"""
    user_id = serializers.IntegerField(required=False)
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)


class UserScheduleSerializer(serializers.Serializer):
    """Сериализатор для получения расписания пользователя"""
    user_id = serializers.IntegerField()
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
