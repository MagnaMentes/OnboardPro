from django.contrib import admin
from .models import AIInsight


@admin.register(AIInsight)
class AIInsightAdmin(admin.ModelAdmin):
    list_display = ('user', 'assignment', 'risk_level', 'created_at')
    list_filter = ('risk_level', 'created_at')
    search_fields = ('user__email', 'user__full_name', 'reason')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
