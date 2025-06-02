from django.contrib import admin
from .models import AIInsight, AIRecommendation
from .client_models import ClientAIInsight
from .insights_models import AIInsightV2, InsightTag
from .recommendations_models import AIRecommendationV2


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


@admin.register(InsightTag)
class InsightTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'category',
                    'color', 'parent', 'created_at')
    list_filter = ('category', 'color', 'created_at')
    search_fields = ('name', 'description', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    date_hierarchy = 'created_at'


@admin.register(AIInsightV2)
class AIInsightV2Admin(admin.ModelAdmin):
    list_display = ('title', 'insight_type', 'level',
                    'status', 'source', 'user', 'created_at')
    list_filter = ('insight_type', 'level', 'status', 'source', 'created_at')
    search_fields = ('title', 'description', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'resolved_at')
    date_hierarchy = 'created_at'
    filter_horizontal = ('tags',)
    actions = ['resolve_insights', 'dismiss_insights', 'acknowledge_insights']

    def resolve_insights(self, request, queryset):
        for insight in queryset:
            insight.resolve()
    resolve_insights.short_description = "Отметить выбранные инсайты как разрешенные"

    def dismiss_insights(self, request, queryset):
        for insight in queryset:
            insight.dismiss()
    dismiss_insights.short_description = "Отметить выбранные инсайты как отклоненные"

    def acknowledge_insights(self, request, queryset):
        for insight in queryset:
            insight.acknowledge()
    acknowledge_insights.short_description = "Отметить выбранные инсайты как подтвержденные"


@admin.register(AIRecommendationV2)
class AIRecommendationV2Admin(admin.ModelAdmin):
    list_display = ('title', 'recommendation_type', 'priority',
                    'status', 'user', 'generated_at')
    list_filter = ('recommendation_type', 'priority', 'status', 'generated_at')
    search_fields = ('title', 'recommendation_text', 'user__email')
    readonly_fields = ('generated_at', 'expires_at', 'resolved_at')
    date_hierarchy = 'generated_at'
    filter_horizontal = ('tags',)
    actions = ['accept_recommendations', 'reject_recommendations']

    def accept_recommendations(self, request, queryset):
        for recommendation in queryset:
            recommendation.accept(user=request.user)
    accept_recommendations.short_description = "Принять выбранные рекомендации"

    def reject_recommendations(self, request, queryset):
        for recommendation in queryset:
            recommendation.reject(user=request.user)
    reject_recommendations.short_description = "Отклонить выбранные рекомендации"
