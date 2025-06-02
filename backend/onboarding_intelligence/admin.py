from django.contrib import admin
from django.utils.html import format_html
from .models import (
    OnboardingProgressSnapshot,
    OnboardingRiskPrediction,
    OnboardingAnomaly,
    OnboardingDepartmentSummary
)


@admin.register(OnboardingProgressSnapshot)
class OnboardingProgressSnapshotAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user_full_name',
        'department_name',
        'completion_percentage_colored',
        'snapshot_date',
        'steps_completed',
        'steps_total',
        'steps_overdue'
    )
    list_filter = ('department', 'snapshot_date')
    search_fields = ('user__email', 'user__first_name',
                     'user__last_name', 'department__name')
    readonly_fields = ('snapshot_date',)
    date_hierarchy = 'snapshot_date'

    def user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else "—"
    user_full_name.short_description = "Сотрудник"

    def department_name(self, obj):
        return obj.department.name if obj.department else "—"
    department_name.short_description = "Отдел"

    def completion_percentage_colored(self, obj):
        color = '#4caf50' if obj.completion_percentage >= 75 else \
            '#ff9800' if obj.completion_percentage >= 50 else \
            '#f44336'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color,
            obj.completion_percentage
        )
    completion_percentage_colored.short_description = "Прогресс"


@admin.register(OnboardingRiskPrediction)
class OnboardingRiskPredictionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user_full_name',
        'department_name',
        'risk_type_display',
        'severity_colored',
        'probability_percentage',
        'created_at'
    )
    list_filter = ('risk_type', 'severity', 'department', 'created_at')
    search_fields = ('user__email', 'user__first_name',
                     'user__last_name', 'recommendation')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    def user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else "—"
    user_full_name.short_description = "Сотрудник"

    def department_name(self, obj):
        return obj.department.name if obj.department else "—"
    department_name.short_description = "Отдел"

    def severity_colored(self, obj):
        colors = {'low': '#4caf50', 'medium': '#ff9800', 'high': '#f44336'}
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.severity, '#000'),
            obj.get_severity_display()
        )
    severity_colored.short_description = "Серьезность"

    def probability_percentage(self, obj):
        return f"{obj.probability * 100:.1f}%"
    probability_percentage.short_description = "Вероятность"

    def risk_type_display(self, obj):
        return obj.get_risk_type_display() if hasattr(obj, 'get_risk_type_display') else str(obj.risk_type)
    risk_type_display.short_description = "Тип риска"


@admin.register(OnboardingAnomaly)
class OnboardingAnomalyAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user_full_name',
        'department_name',
        'anomaly_type_display',
        'severity_colored',
        'resolved',
        'detected_at'
    )
    list_filter = ('anomaly_type', 'department', 'detected_at', 'resolved')
    search_fields = ('user__email', 'user__first_name',
                     'user__last_name', 'description')
    readonly_fields = ('detected_at',)
    date_hierarchy = 'detected_at'

    def user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else "—"
    user_full_name.short_description = "Сотрудник"

    def department_name(self, obj):
        return obj.department.name if obj.department else "—"
    department_name.short_description = "Отдел"

    def anomaly_type_display(self, obj):
        return obj.get_anomaly_type_display() if hasattr(obj, 'get_anomaly_type_display') else str(obj.anomaly_type)
    anomaly_type_display.short_description = "Тип аномалии"

    def severity_colored(self, obj):
        colors = {'low': '#4caf50', 'medium': '#ff9800', 'high': '#f44336'}
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.severity, '#000'),
            obj.get_severity_display()
        )
    severity_colored.short_description = "Серьезность"


@admin.register(OnboardingDepartmentSummary)
class OnboardingDepartmentSummaryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'department',
        'total_users',
        'active_onboardings',
        'completed_onboardings',
        'avg_completion_percentage',
        'high_risk_users',
        'health_score_colored',
        'updated_at'
    )
    list_filter = ('department', 'summary_date')
    search_fields = ('department__name',)
    readonly_fields = ('summary_date',)
    date_hierarchy = 'summary_date'

    def updated_at(self, obj):
        return obj.summary_date
    updated_at.short_description = "Обновлено"

    def total_users(self, obj):
        return obj.active_onboardings + obj.completed_onboardings
    total_users.short_description = "Всего пользователей"

    def high_risk_users(self, obj):
        return int(obj.risk_factor * self.total_users(obj))
    high_risk_users.short_description = "В зоне риска"

    def health_score_colored(self, obj):
        score = 100 * (1 - obj.risk_factor)
        color = '#4caf50' if score >= 75 else '#ff9800' if score >= 50 else '#f44336'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color,
            score
        )
    health_score_colored.short_description = "Индекс здоровья"
