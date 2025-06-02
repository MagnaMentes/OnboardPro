from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from .models import (
    OnboardingProgressSnapshot,
    OnboardingRiskPrediction,
    OnboardingAnomaly,
    OnboardingDepartmentSummary
)


class OnboardingProgressSnapshotSerializer(serializers.ModelSerializer):
    """
    Сериализатор для снимков прогресса онбординга
    """
    user_full_name = serializers.CharField(
        source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(
        source='department.name', read_only=True)
    program_name = serializers.CharField(
        source='assignment.program.name', read_only=True)

    class Meta:
        model = OnboardingProgressSnapshot
        fields = [
            'id', 'user', 'user_full_name', 'user_email', 'assignment', 'department',
            'department_name', 'program_name', 'completion_percentage', 'steps_total',
            'steps_completed', 'steps_in_progress', 'steps_not_started', 'steps_overdue',
            'avg_step_completion_time', 'last_activity_time', 'snapshot_date'
        ]
        read_only_fields = fields


class OnboardingRiskPredictionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для прогнозов рисков онбординга
    """
    user_full_name = serializers.CharField(
        source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(
        source='department.name', read_only=True)
    program_name = serializers.CharField(
        source='assignment.program.name', read_only=True)
    risk_type_display = serializers.CharField(
        source='get_risk_type_display', read_only=True)
    severity_display = serializers.CharField(
        source='get_severity_display', read_only=True)

    class Meta:
        model = OnboardingRiskPrediction
        fields = [
            'id', 'user', 'user_full_name', 'user_email', 'assignment', 'department',
            'department_name', 'program_name', 'risk_type', 'risk_type_display',
            'severity', 'severity_display', 'probability', 'factors', 'estimated_impact',
            'recommendation', 'created_at'
        ]
        read_only_fields = fields


class OnboardingAnomalySerializer(serializers.ModelSerializer):
    """
    Сериализатор для аномалий в онбординге
    """
    user_full_name = serializers.CharField(
        source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    department_name = serializers.CharField(
        source='department.name', read_only=True)
    program_name = serializers.CharField(
        source='assignment.program.name', read_only=True)
    anomaly_type_display = serializers.CharField(
        source='get_anomaly_type_display', read_only=True)
    step_name = serializers.CharField(source='step.step.name', read_only=True)

    class Meta:
        model = OnboardingAnomaly
        fields = [
            'id', 'user', 'user_full_name', 'user_email', 'assignment', 'department',
            'department_name', 'program_name', 'anomaly_type', 'anomaly_type_display',
            'step', 'step_name', 'description', 'details', 'detected_at', 'resolved',
            'resolved_at', 'resolution_notes'
        ]
        read_only_fields = ['id', 'user', 'user_full_name', 'user_email', 'assignment', 'department',
                            'department_name', 'program_name', 'anomaly_type', 'anomaly_type_display',
                            'step', 'step_name', 'description', 'details', 'detected_at']


class OnboardingDepartmentSummarySerializer(serializers.ModelSerializer):
    """
    Сериализатор для сводок по департаментам
    """
    department_name = serializers.CharField(
        source='department.name', read_only=True)

    class Meta:
        model = OnboardingDepartmentSummary
        fields = [
            'id', 'department', 'department_name', 'active_onboardings', 'completed_onboardings',
            'avg_completion_time', 'avg_completion_percentage', 'risk_factor',
            'most_common_bottlenecks', 'summary_date'
        ]
        read_only_fields = fields


class ResolveAnomalySerializer(serializers.Serializer):
    """
    Сериализатор для разрешения аномалии
    """
    resolution_notes = serializers.CharField(required=False)
