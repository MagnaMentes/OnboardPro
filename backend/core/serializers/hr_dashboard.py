from rest_framework import serializers
from django.db.models import Avg
from ..models.hr_dashboard import HRMetricSnapshot, HRAlert, HRAlertRule


class HRMetricSnapshotSerializer(serializers.ModelSerializer):
    """
    Сериализатор для снэпшотов метрик HR-дашборда
    """
    class Meta:
        model = HRMetricSnapshot
        fields = ['id', 'timestamp', 'metric_key',
                  'metric_value', 'department']
        read_only_fields = ['timestamp']


class HRAlertRuleSerializer(serializers.ModelSerializer):
    """
    Сериализатор для правил генерации HR-алертов
    """
    class Meta:
        model = HRAlertRule
        fields = [
            'id', 'name', 'description', 'severity', 'is_active',
            'metric_key', 'threshold_value', 'comparison',
            'notify_hr', 'notify_admin', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HRAlertSerializer(serializers.ModelSerializer):
    """
    Сериализатор для HR-алертов
    """
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    resolved_by_name = serializers.CharField(
        source='resolved_by.get_full_name', read_only=True)
    department_name = serializers.CharField(
        source='department.name', read_only=True)

    class Meta:
        model = HRAlert
        fields = [
            'id', 'title', 'message', 'rule', 'rule_name',
            'severity', 'status', 'department', 'department_name',
            'created_at', 'updated_at', 'resolved_by', 'resolved_by_name',
            'resolved_at', 'resolution_notes'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'resolved_at',
            'rule_name', 'resolved_by_name', 'department_name'
        ]


class HRDashboardOverviewSerializer(serializers.Serializer):
    """
    Сериализатор для общего обзора HR-дашборда
    """
    # Метрики онбординга
    active_onboarding_count = serializers.IntegerField()
    avg_completion_rate = serializers.FloatField()
    overdue_steps_count = serializers.IntegerField()

    # Метрики фидбэка
    negative_feedback_rate = serializers.FloatField()
    avg_sentiment_score = serializers.FloatField()

    # Метрики по департаментам
    avg_department_completion_rate = serializers.FloatField()

    # Метрики алертов
    open_alerts_count = serializers.SerializerMethodField()
    high_severity_alerts_count = serializers.SerializerMethodField()

    def get_open_alerts_count(self, obj):
        return HRAlert.objects.filter(status=HRAlert.Status.OPEN).count()

    def get_high_severity_alerts_count(self, obj):
        return HRAlert.objects.filter(
            status=HRAlert.Status.OPEN,
            severity=HRAlertRule.Severity.HIGH
        ).count()


class DepartmentMetricsSerializer(serializers.Serializer):
    """
    Сериализатор для метрик департамента
    """
    department_id = serializers.IntegerField()
    department_name = serializers.CharField()
    active_employees = serializers.IntegerField()
    completed_employees = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    avg_sentiment = serializers.SerializerMethodField()
    open_alerts = serializers.SerializerMethodField()

    def get_avg_sentiment(self, obj):
        return obj.get('avg_sentiment', 0.0)

    def get_open_alerts(self, obj):
        return HRAlert.objects.filter(
            department_id=obj['department_id'],
            status=HRAlert.Status.OPEN
        ).count()
