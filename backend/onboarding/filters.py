from django_filters import rest_framework as filters
from .models import (
    OnboardingProgram, OnboardingStep, UserOnboardingAssignment,
    UserStepProgress, VirtualMeetingSlot, AIHint
)


class OnboardingProgramFilter(filters.FilterSet):
    """
    Фильтр для онбординг-программ
    """
    name = filters.CharFilter(lookup_expr='icontains')
    created_at_before = filters.DateTimeFilter(
        field_name='created_at', lookup_expr='lte')
    created_at_after = filters.DateTimeFilter(
        field_name='created_at', lookup_expr='gte')
    author_id = filters.NumberFilter(field_name='author__id')

    class Meta:
        model = OnboardingProgram
        fields = ['name', 'created_at_before', 'created_at_after', 'author_id']


class OnboardingStepFilter(filters.FilterSet):
    """
    Фильтр для шагов онбординг-программ
    """
    name = filters.CharFilter(lookup_expr='icontains')
    step_type = filters.ChoiceFilter(choices=OnboardingStep.StepType.choices)
    program_id = filters.NumberFilter(field_name='program__id')
    is_required = filters.BooleanFilter()
    is_virtual_meeting = filters.BooleanFilter()

    class Meta:
        model = OnboardingStep
        fields = ['name', 'step_type', 'program_id',
                  'is_required', 'is_virtual_meeting']


class UserOnboardingAssignmentFilter(filters.FilterSet):
    """
    Фильтр для назначений онбординг-программ пользователям
    """
    user_id = filters.NumberFilter(field_name='user__id')
    program_id = filters.NumberFilter(field_name='program__id')
    status = filters.ChoiceFilter(
        choices=UserOnboardingAssignment.AssignmentStatus.choices)
    assigned_at_before = filters.DateTimeFilter(
        field_name='assigned_at', lookup_expr='lte')
    assigned_at_after = filters.DateTimeFilter(
        field_name='assigned_at', lookup_expr='gte')

    class Meta:
        model = UserOnboardingAssignment
        fields = ['user_id', 'program_id', 'status',
                  'assigned_at_before', 'assigned_at_after']


class UserStepProgressFilter(filters.FilterSet):
    """
    Фильтр для прогресса пользователя по шагам онбординга
    """
    user_id = filters.NumberFilter(field_name='user__id')
    step_id = filters.NumberFilter(field_name='step__id')
    program_id = filters.NumberFilter(field_name='step__program__id')
    status = filters.ChoiceFilter(
        choices=UserStepProgress.ProgressStatus.choices)
    completed_before = filters.DateTimeFilter(
        field_name='completed_at', lookup_expr='lte')
    completed_after = filters.DateTimeFilter(
        field_name='completed_at', lookup_expr='gte')
    planned_start_before = filters.DateTimeFilter(
        field_name='planned_date_start', lookup_expr='lte')
    planned_start_after = filters.DateTimeFilter(
        field_name='planned_date_start', lookup_expr='gte')
    planned_end_before = filters.DateTimeFilter(
        field_name='planned_date_end', lookup_expr='lte')
    planned_end_after = filters.DateTimeFilter(
        field_name='planned_date_end', lookup_expr='gte')

    class Meta:
        model = UserStepProgress
        fields = [
            'user_id', 'step_id', 'program_id', 'status',
            'completed_before', 'completed_after',
            'planned_start_before', 'planned_start_after',
            'planned_end_before', 'planned_end_after'
        ]


class VirtualMeetingSlotFilter(filters.FilterSet):
    """
    Фильтр для виртуальных встреч
    """
    step_id = filters.NumberFilter(field_name='step__id')
    assigned_user_id = filters.NumberFilter(field_name='assigned_user__id')
    start_after = filters.DateTimeFilter(
        field_name='start_time', lookup_expr='gte')
    start_before = filters.DateTimeFilter(
        field_name='start_time', lookup_expr='lte')
    end_after = filters.DateTimeFilter(
        field_name='end_time', lookup_expr='gte')
    end_before = filters.DateTimeFilter(
        field_name='end_time', lookup_expr='lte')

    class Meta:
        model = VirtualMeetingSlot
        fields = [
            'step_id', 'assigned_user_id',
            'start_after', 'start_before',
            'end_after', 'end_before'
        ]


class AIHintFilter(filters.FilterSet):
    """
    Фильтр для AI-подсказок
    """
    assignment_step_id = filters.NumberFilter(field_name='assignment_step__id')
    user_id = filters.NumberFilter(field_name='assignment_step__user__id')
    step_id = filters.NumberFilter(field_name='assignment_step__step__id')
    created_after = filters.DateTimeFilter(
        field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(
        field_name='created_at', lookup_expr='lte')

    class Meta:
        model = AIHint
        fields = ['assignment_step_id', 'user_id',
                  'step_id', 'created_after', 'created_before']
