"""
Конфигурация Django Admin для моделей Smart Feedback Dashboard
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from ..dashboard_models import FeedbackTrendSnapshot, FeedbackTrendRule, FeedbackTrendAlert


@admin.register(FeedbackTrendSnapshot)
class FeedbackTrendSnapshotAdmin(admin.ModelAdmin):
    """
    Административный интерфейс для исторических срезов трендов
    """
    list_display = ('id', 'get_template_title', 'get_department_name', 'date',
                    'sentiment_score', 'satisfaction_index', 'response_count')
    list_filter = ('date', 'template', 'department')
    search_fields = ('template__title', 'department__name')
    date_hierarchy = 'date'

    def get_template_title(self, obj):
        return obj.template.title if obj.template else _('Global')
    get_template_title.short_description = _('Template')

    def get_department_name(self, obj):
        return obj.department.name if obj.department else _('All Departments')
    get_department_name.short_description = _('Department')

    def has_add_permission(self, request):
        # Запрещаем ручное создание снимков через админку
        return False


@admin.register(FeedbackTrendRule)
class FeedbackTrendRuleAdmin(admin.ModelAdmin):
    """
    Административный интерфейс для правил анализа трендов
    """
    list_display = ('id', 'name', 'rule_type', 'threshold',
                    'measurement_period_days', 'is_active', 'created_at')
    list_filter = ('rule_type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    filter_horizontal = ('templates', 'departments')
    readonly_fields = ('created_by', 'created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'rule_type', 'threshold',
                       'measurement_period_days', 'is_active')
        }),
        (_('Filters'), {
            'fields': ('templates', 'departments'),
        }),
        (_('System Info'), {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Если это новый объект
            obj.created_by = request.user
        obj.save()


@admin.register(FeedbackTrendAlert)
class FeedbackTrendAlertAdmin(admin.ModelAdmin):
    """
    Административный интерфейс для алертов изменений трендов
    """
    list_display = ('id', 'title', 'rule', 'severity', 'is_resolved',
                    'get_template_title', 'get_department_name', 'created_at')
    list_filter = ('severity', 'is_resolved', 'rule__rule_type',
                   'template', 'department', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('rule', 'template', 'department', 'title', 'description',
                       'severity', 'previous_value', 'current_value', 'percentage_change',
                       'created_at', 'resolved_by', 'resolved_at')
    fieldsets = (
        (None, {
            'fields': ('rule', 'title', 'description', 'severity')
        }),
        (_('Context'), {
            'fields': ('template', 'department', 'previous_value',
                       'current_value', 'percentage_change'),
        }),
        (_('Resolution'), {
            'fields': ('is_resolved', 'resolved_by', 'resolved_at', 'resolution_comment'),
        }),
        (_('System Info'), {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )

    def get_template_title(self, obj):
        return obj.template.title if obj.template else _('Global')
    get_template_title.short_description = _('Template')

    def get_department_name(self, obj):
        return obj.department.name if obj.department else _('All Departments')
    get_department_name.short_description = _('Department')

    def has_add_permission(self, request):
        # Запрещаем ручное создание алертов через админку
        return False
