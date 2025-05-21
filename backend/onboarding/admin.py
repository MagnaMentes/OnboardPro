from django.contrib import admin
from .models import OnboardingProgram, OnboardingStep, UserOnboardingAssignment, UserStepProgress
from .feedback_models import FeedbackMood, StepFeedback

# Register your models here.


@admin.register(OnboardingProgram)
class OnboardingProgramAdmin(admin.ModelAdmin):
    list_display = ('name', 'author', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('author', 'created_at')


@admin.register(OnboardingStep)
class OnboardingStepAdmin(admin.ModelAdmin):
    list_display = ('name', 'program', 'step_type',
                    'order', 'is_required', 'deadline_days')
    list_filter = ('program', 'step_type', 'is_required')
    search_fields = ('name', 'description')
    list_editable = ('order', 'is_required', 'deadline_days')


@admin.register(UserOnboardingAssignment)
class UserOnboardingAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'program', 'assigned_at', 'status')
    list_filter = ('program__name', 'status')
    search_fields = ('user__email', 'program__name')
    list_editable = ('status',)
    raw_id_fields = ('user', 'program')


@admin.register(UserStepProgress)
class UserStepProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'step', 'status', 'completed_at')
    list_filter = ('status', 'step__program')
    search_fields = ('user__email', 'step__name')
    raw_id_fields = ('user', 'step')
    list_editable = ('status',)


@admin.register(FeedbackMood)
class FeedbackMoodAdmin(admin.ModelAdmin):
    list_display = ('user', 'assignment', 'value', 'created_at')
    list_filter = ('value', 'created_at')
    search_fields = ('user__email', 'assignment__program__name', 'comment')
    raw_id_fields = ('user', 'assignment')


@admin.register(StepFeedback)
class StepFeedbackAdmin(admin.ModelAdmin):
    list_display = ('user', 'step', 'assignment', 'created_at')
    list_filter = ('step__program', 'created_at')
    search_fields = ('user__email', 'step__name', 'comment')
    raw_id_fields = ('user', 'step', 'assignment')
