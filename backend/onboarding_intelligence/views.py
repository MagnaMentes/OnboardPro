from datetime import timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg, Sum
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend

from users.permissions import IsAdminOrHR
from .models import (
    OnboardingProgressSnapshot,
    OnboardingRiskPrediction,
    OnboardingAnomaly,
    OnboardingDepartmentSummary
)
from .serializers import (
    OnboardingProgressSnapshotSerializer,
    OnboardingRiskPredictionSerializer,
    OnboardingAnomalySerializer,
    OnboardingDepartmentSummarySerializer,
    ResolveAnomalySerializer
)
from departments.models import Department


User = get_user_model()


class IntelligenceDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet для получения общей панели управления прогрессом онбординга
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]

    def list(self, request):
        """
        Возвращает общую статистику по всем онбордингам
        """
        # Получаем данные по снимкам прогресса
        current_date = timezone.now()
        start_date = current_date - timedelta(days=30)

        # Общие метрики
        total_users = User.objects.all().count()
        active_onboardings = OnboardingProgressSnapshot.objects.filter(
            snapshot_date__gte=start_date
        ).order_by('user').distinct('user').count()

        # Средний прогресс
        avg_progress = OnboardingProgressSnapshot.objects.filter(
            snapshot_date__gte=start_date
        ).order_by('user', '-snapshot_date').distinct('user').aggregate(
            avg=Avg('completion_percentage')
        )['avg'] or 0.0

        # Риски и аномалии
        high_risks = OnboardingRiskPrediction.objects.filter(
            severity=OnboardingRiskPrediction.RiskSeverity.HIGH,
            created_at__gte=start_date
        ).count()

        active_anomalies = OnboardingAnomaly.objects.filter(
            resolved=False
        ).count()

        # Департаменты с самым высоким риском
        departments_at_risk = OnboardingDepartmentSummary.objects.filter(
            summary_date__gte=start_date
        ).order_by('department', '-summary_date').distinct('department').order_by('-risk_factor')[:5]

        departments_at_risk_data = OnboardingDepartmentSummarySerializer(
            departments_at_risk, many=True).data

        # Последние аномалии
        recent_anomalies = OnboardingAnomaly.objects.filter(
            resolved=False
        ).order_by('-detected_at')[:10]

        recent_anomalies_data = OnboardingAnomalySerializer(
            recent_anomalies, many=True).data

        # Распределение прогресса по департаментам
        department_progress = OnboardingProgressSnapshot.objects.filter(
            snapshot_date__gte=start_date,
            department__isnull=False
        ).order_by('department', '-snapshot_date').distinct('department').values(
            'department__name', 'completion_percentage'
        )

        # Типы рисков
        risk_types = OnboardingRiskPrediction.objects.filter(
            created_at__gte=start_date
        ).values('risk_type').annotate(
            count=Count('id')
        ).order_by('-count')

        # Типы аномалий
        anomaly_types = OnboardingAnomaly.objects.filter(
            detected_at__gte=start_date
        ).values('anomaly_type').annotate(
            count=Count('id')
        ).order_by('-count')

        # Строим объект с данными дашборда
        dashboard_data = {
            'summary': {
                'total_users': total_users,
                'active_onboardings': active_onboardings,
                'avg_progress': avg_progress,
                'high_risks': high_risks,
                'active_anomalies': active_anomalies,
            },
            'departments_at_risk': departments_at_risk_data,
            'recent_anomalies': recent_anomalies_data,
            'department_progress': list(department_progress),
            'risk_distribution': list(risk_types),
            'anomaly_distribution': list(anomaly_types),
        }

        return Response(dashboard_data)


class UserIntelligenceDashboardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для получения аналитики по конкретному пользователю
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = OnboardingProgressSnapshotSerializer
    lookup_field = 'user_id'

    def get_queryset(self):
        return OnboardingProgressSnapshot.objects.filter(
            user_id=self.kwargs.get('user_id')
        ).order_by('-snapshot_date')

    def retrieve(self, request, user_id=None):
        """
        Возвращает аналитику по конкретному пользователю
        """
        # Получаем последний снимок прогресса
        latest_snapshot = OnboardingProgressSnapshot.objects.filter(
            user_id=user_id
        ).order_by('-snapshot_date').first()

        if not latest_snapshot:
            return Response({'detail': 'Нет данных для этого пользователя'}, status=status.HTTP_404_NOT_FOUND)

        snapshot_data = OnboardingProgressSnapshotSerializer(
            latest_snapshot).data

        # Получаем прогноз рисков
        risks = OnboardingRiskPrediction.objects.filter(
            user_id=user_id
        ).order_by('-created_at')[:10]

        risks_data = OnboardingRiskPredictionSerializer(risks, many=True).data

        # Получаем аномалии
        anomalies = OnboardingAnomaly.objects.filter(
            user_id=user_id
        ).order_by('-detected_at')[:10]

        anomalies_data = OnboardingAnomalySerializer(anomalies, many=True).data

        # История прогресса (последние 30 дней)
        progress_history = OnboardingProgressSnapshot.objects.filter(
            user_id=user_id,
            snapshot_date__gte=timezone.now() - timedelta(days=30)
        ).order_by('snapshot_date').values('snapshot_date', 'completion_percentage')

        # Строим объект с данными пользователя
        user_data = {
            'user_info': {
                'id': latest_snapshot.user.id,
                'email': latest_snapshot.user.email,
                'full_name': latest_snapshot.user.get_full_name(),
                'department': latest_snapshot.department.name if latest_snapshot.department else None,
            },
            'current_snapshot': snapshot_data,
            'risks': risks_data,
            'anomalies': anomalies_data,
            'progress_history': list(progress_history),
        }

        return Response(user_data)


class DepartmentIntelligenceDashboardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для получения аналитики по конкретному департаменту
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = OnboardingDepartmentSummarySerializer
    lookup_field = 'department_id'

    def get_queryset(self):
        return OnboardingDepartmentSummary.objects.filter(
            department_id=self.kwargs.get('department_id')
        ).order_by('-summary_date')

    def retrieve(self, request, department_id=None):
        """
        Возвращает аналитику по конкретному департаменту
        """
        # Получаем последнюю сводку по департаменту
        latest_summary = OnboardingDepartmentSummary.objects.filter(
            department_id=department_id
        ).order_by('-summary_date').first()

        if not latest_summary:
            return Response({'detail': 'Нет данных для этого департамента'}, status=status.HTTP_404_NOT_FOUND)

        summary_data = OnboardingDepartmentSummarySerializer(
            latest_summary).data

        # Получаем риски для этого департамента
        risks = OnboardingRiskPrediction.objects.filter(
            department_id=department_id
        ).order_by('-created_at')[:10]

        risks_data = OnboardingRiskPredictionSerializer(risks, many=True).data

        # Получаем аномалии для этого департамента
        anomalies = OnboardingAnomaly.objects.filter(
            department_id=department_id
        ).order_by('-detected_at')[:10]

        anomalies_data = OnboardingAnomalySerializer(anomalies, many=True).data

        # Пользователи с самым низким прогрессом
        users_with_low_progress = OnboardingProgressSnapshot.objects.filter(
            department_id=department_id
        ).order_by('user', '-snapshot_date').distinct('user').order_by('completion_percentage')[:5]

        low_progress_data = OnboardingProgressSnapshotSerializer(
            users_with_low_progress, many=True).data

        # История среднего прогресса (последние 30 дней)
        progress_history = OnboardingProgressSnapshot.objects.filter(
            department_id=department_id,
            snapshot_date__gte=timezone.now() - timedelta(days=30)
        ).values('snapshot_date').annotate(
            avg_percentage=Avg('completion_percentage')
        ).order_by('snapshot_date')

        # Строим объект с данными департамента
        department_data = {
            'department_info': {
                'id': latest_summary.department.id,
                'name': latest_summary.department.name,
                'manager': latest_summary.department.manager.get_full_name() if latest_summary.department.manager else None,
            },
            'current_summary': summary_data,
            'risks': risks_data,
            'anomalies': anomalies_data,
            'users_with_low_progress': low_progress_data,
            'progress_history': list(progress_history),
        }

        return Response(department_data)


class AlertsViewSet(viewsets.ViewSet):
    """
    ViewSet для получения предупреждений о рисках и аномалиях
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]

    def list(self, request):
        """
        Возвращает список активных предупреждений
        """
        # Получаем высокие риски
        high_risks = OnboardingRiskPrediction.objects.filter(
            severity=OnboardingRiskPrediction.RiskSeverity.HIGH,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')

        high_risks_data = OnboardingRiskPredictionSerializer(
            high_risks, many=True).data

        # Получаем нерешенные аномалии
        active_anomalies = OnboardingAnomaly.objects.filter(
            resolved=False
        ).order_by('-detected_at')

        anomalies_data = OnboardingAnomalySerializer(
            active_anomalies, many=True).data

        # Группируем предупреждения по пользователям и департаментам
        users_with_alerts = {}
        for risk in high_risks:
            user_id = risk.user_id
            if user_id not in users_with_alerts:
                users_with_alerts[user_id] = {
                    'user_id': user_id,
                    'user_full_name': risk.user.get_full_name(),
                    'user_email': risk.user.email,
                    'department_id': risk.department_id,
                    'department_name': risk.department.name if risk.department else None,
                    'risks_count': 0,
                    'anomalies_count': 0
                }
            users_with_alerts[user_id]['risks_count'] += 1

        for anomaly in active_anomalies:
            user_id = anomaly.user_id
            if user_id not in users_with_alerts:
                users_with_alerts[user_id] = {
                    'user_id': user_id,
                    'user_full_name': anomaly.user.get_full_name(),
                    'user_email': anomaly.user.email,
                    'department_id': anomaly.department_id,
                    'department_name': anomaly.department.name if anomaly.department else None,
                    'risks_count': 0,
                    'anomalies_count': 0
                }
            users_with_alerts[user_id]['anomalies_count'] += 1

        # Группируем предупреждения по департаментам
        departments_with_alerts = {}
        for user_data in users_with_alerts.values():
            department_id = user_data['department_id']
            if department_id:
                if department_id not in departments_with_alerts:
                    departments_with_alerts[department_id] = {
                        'department_id': department_id,
                        'department_name': user_data['department_name'],
                        'users_count': 0,
                        'risks_count': 0,
                        'anomalies_count': 0
                    }
                departments_with_alerts[department_id]['users_count'] += 1
                departments_with_alerts[department_id]['risks_count'] += user_data['risks_count']
                departments_with_alerts[department_id]['anomalies_count'] += user_data['anomalies_count']

        # Строим объект с данными предупреждений
        alerts_data = {
            'summary': {
                'total_high_risks': high_risks.count(),
                'total_anomalies': active_anomalies.count(),
                'users_with_alerts': len(users_with_alerts),
                'departments_with_alerts': len(departments_with_alerts)
            },
            'high_risks': high_risks_data,
            'active_anomalies': anomalies_data,
            'users_with_alerts': list(users_with_alerts.values()),
            'departments_with_alerts': list(departments_with_alerts.values())
        }

        return Response(alerts_data)


class AnomalyViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с аномалиями
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = OnboardingAnomalySerializer
    queryset = OnboardingAnomaly.objects.all().order_by('-detected_at')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'department', 'anomaly_type', 'resolved']

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Отмечает аномалию как разрешенную
        """
        anomaly = self.get_object()
        serializer = ResolveAnomalySerializer(data=request.data)

        if serializer.is_valid():
            notes = serializer.validated_data.get('resolution_notes', '')
            anomaly.resolve(notes)
            return Response({'status': 'anomaly resolved'})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RiskPredictionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для работы с прогнозами рисков
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = OnboardingRiskPredictionSerializer
    queryset = OnboardingRiskPrediction.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'department', 'risk_type', 'severity']
