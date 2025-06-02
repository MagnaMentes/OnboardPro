"""
Сериализаторы для моделей Smart Feedback Dashboard
"""
from rest_framework import serializers
from ..dashboard_models import FeedbackTrendSnapshot, FeedbackTrendRule, FeedbackTrendAlert
from ..models import FeedbackTemplate
from departments.models import Department
from departments.serializers import DepartmentSerializer as DepartmentListSerializer
from users.serializers import UserMinimalSerializer as UserMiniSerializer


class FeedbackTemplateMinSerializer(serializers.ModelSerializer):
    """
    Минималистичный сериализатор для шаблона обратной связи
    """
    class Meta:
        model = FeedbackTemplate
        fields = ['id', 'title', 'type']


class FeedbackTrendSnapshotSerializer(serializers.ModelSerializer):
    """
    Сериализатор для исторических срезов трендов обратной связи
    """
    template_data = FeedbackTemplateMinSerializer(
        source='template', read_only=True)
    department_data = DepartmentListSerializer(
        source='department', read_only=True)

    class Meta:
        model = FeedbackTrendSnapshot
        fields = [
            'id', 'template', 'template_data', 'department', 'department_data',
            'date', 'sentiment_score', 'response_count', 'main_topics',
            'common_issues', 'satisfaction_index', 'created_at'
        ]


class FeedbackTrendRuleSerializer(serializers.ModelSerializer):
    """
    Сериализатор для правил анализа трендов
    """
    templates_data = FeedbackTemplateMinSerializer(
        source='templates', read_only=True, many=True)
    departments_data = DepartmentListSerializer(
        source='departments', read_only=True, many=True)
    created_by_data = UserMiniSerializer(source='created_by', read_only=True)
    rule_type_display = serializers.CharField(
        source='get_rule_type_display', read_only=True)

    class Meta:
        model = FeedbackTrendRule
        fields = [
            'id', 'name', 'description', 'rule_type', 'rule_type_display',
            'threshold', 'measurement_period_days', 'is_active',
            'templates', 'templates_data',
            'departments', 'departments_data',
            'created_by', 'created_by_data',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class FeedbackTrendAlertSerializer(serializers.ModelSerializer):
    """
    Сериализатор для алертов изменений трендов
    """
    rule_data = serializers.SerializerMethodField()
    template_data = FeedbackTemplateMinSerializer(
        source='template', read_only=True)
    department_data = DepartmentListSerializer(
        source='department', read_only=True)
    severity_display = serializers.CharField(
        source='get_severity_display', read_only=True)
    resolved_by_data = UserMiniSerializer(source='resolved_by', read_only=True)

    class Meta:
        model = FeedbackTrendAlert
        fields = [
            'id', 'rule', 'rule_data',
            'template', 'template_data',
            'department', 'department_data',
            'title', 'description',
            'severity', 'severity_display',
            'previous_value', 'current_value', 'percentage_change',
            'is_resolved', 'resolved_by', 'resolved_by_data',
            'resolved_at', 'resolution_comment',
            'created_at'
        ]
        read_only_fields = [
            'rule', 'template', 'department',
            'title', 'description', 'severity',
            'previous_value', 'current_value', 'percentage_change',
            'is_resolved', 'resolved_by', 'resolved_at',
            'created_at'
        ]

    def get_rule_data(self, obj):
        """
        Возвращает базовую информацию о правиле
        """
        if obj.rule:
            return {
                'id': obj.rule.id,
                'name': obj.rule.name,
                'rule_type': obj.rule.rule_type,
                'rule_type_display': obj.rule.get_rule_type_display()
            }
        return None


class FeedbackTrendAlertResolveSerializer(serializers.Serializer):
    """
    Сериализатор для отметки алерта как разрешенного
    """
    comment = serializers.CharField(required=False, allow_blank=True)
