from django.contrib import admin
from .models import OnboardingProgram, OnboardingStep, UserOnboardingAssignment, UserStepProgress, VirtualMeetingSlot
from .feedback_models import FeedbackMood, StepFeedback
from .lms_models import LMSModule, LMSTest, LMSQuestion, LMSOption, LMSUserAnswer, LMSUserTestResult
from .solomia_models import AIChatMessage

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


@admin.register(VirtualMeetingSlot)
class VirtualMeetingSlotAdmin(admin.ModelAdmin):
    list_display = ('step', 'assigned_user', 'start_time', 'end_time')
    list_filter = ('step__program', 'step', 'start_time')
    search_fields = ('assigned_user__email', 'step__name')
    raw_id_fields = ('step', 'assigned_user')
    date_hierarchy = 'start_time'


# LMS Admin Models
class LMSOptionInline(admin.TabularInline):
    model = LMSOption
    extra = 3


class LMSQuestionInline(admin.StackedInline):
    model = LMSQuestion
    extra = 1


@admin.register(LMSModule)
class LMSModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'step', 'content_type', 'order', 'created_at')
    list_filter = ('content_type', 'step__program')
    search_fields = ('title', 'description', 'content')
    raw_id_fields = ('step',)
    list_editable = ('order',)


@admin.register(LMSTest)
class LMSTestAdmin(admin.ModelAdmin):
    list_display = ('title', 'step', 'created_at')
    list_filter = ('step__program', 'created_at')
    search_fields = ('title', 'description')
    raw_id_fields = ('step',)
    inlines = [LMSQuestionInline]


@admin.register(LMSQuestion)
class LMSQuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'test', 'order')
    list_filter = ('test__step__program',)
    search_fields = ('text',)
    raw_id_fields = ('test',)
    list_editable = ('order',)
    inlines = [LMSOptionInline]


@admin.register(LMSOption)
class LMSOptionAdmin(admin.ModelAdmin):
    list_display = ('text', 'question', 'is_correct', 'order')
    list_filter = ('is_correct',)
    search_fields = ('text',)
    raw_id_fields = ('question',)
    list_editable = ('is_correct', 'order')


@admin.register(LMSUserAnswer)
class LMSUserAnswerAdmin(admin.ModelAdmin):
    list_display = ('user', 'question', 'selected_option', 'answered_at')
    list_filter = ('question__test__step__program', 'answered_at')
    search_fields = ('user__email',)
    raw_id_fields = ('user', 'question', 'selected_option')


@admin.register(LMSUserTestResult)
class LMSUserTestResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'test', 'is_passed',
                    'score', 'max_score', 'completed_at')
    list_filter = ('is_passed', 'test__step__program', 'completed_at')
    search_fields = ('user__email', 'test__title')
    raw_id_fields = ('user', 'test')


@admin.register(AIChatMessage)
class AIChatMessageAdmin(admin.ModelAdmin):
    """
    Административная модель для сообщений AI-чата
    """
    list_display = ('user', 'role', 'message_preview',
                    'step_progress', 'created_at')
    list_filter = ('role', 'created_at', 'step_progress__step__program')
    search_fields = ('user__email', 'message', 'step_progress__step__name')
    raw_id_fields = ('user', 'step_progress')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    list_per_page = 50

    def message_preview(self, obj):
        """Возвращает сокращенную версию сообщения для отображения в списке"""
        if len(obj.message) > 50:
            return f"{obj.message[:50]}..."
        return obj.message
    message_preview.short_description = 'Сообщение'
