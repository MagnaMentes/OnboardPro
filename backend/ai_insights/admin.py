from django.contrib import admin
from .models import AIInsight, AIRecommendation
from .client_models import ClientAIInsight


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = ('user', 'assignment', 'risk_level', 'created_at')
    list_filter = ('risk_level', 'created_at')
    search_fields = ('user__email', 'user__full_name', 'reason')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'


@admin.register(ClientAIInsight)
class ClientAIInsightAdmin(admin.ModelAdmin):
    list_display = ('user', 'step', 'assignment', 'dismissed', 'generated_at')
    list_filter = ('dismissed', 'step__step_type', 'generated_at')
    search_fields = ('user__email', 'hint_text', 'step__name')
    readonly_fields = ('generated_at',)
    date_hierarchy = 'generated_at'


@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'assignment', 'step', 'dismissed', 'generated_at')
    list_filter = ('dismissed', 'generated_at')
    search_fields = ('user__email', 'recommendation_text',
                     'assignment__program__name')
    readonly_fields = ('generated_at', 'recommendation_text',
                       'user', 'assignment', 'step')
    date_hierarchy = 'generated_at'
    actions = ['mark_as_dismissed']

    def mark_as_dismissed(self, request, queryset):
        queryset.update(dismissed=True)
    mark_as_dismissed.short_description = "Пометить выбранные рекомендации как скрытые"
