from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, F, Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from users.permissions import IsAdminOrHR
from departments.models import Department
from ..models.hr_dashboard import HRMetricSnapshot, HRAlert, HRAlertRule
from ..serializers.hr_dashboard import (
    HRMetricSnapshotSerializer,
    HRAlertSerializer,
    HRAlertRuleSerializer,
    HRDashboardOverviewSerializer,
    DepartmentMetricsSerializer
)
from ..services.hr_dashboard import HRDashboardAggregatorService


class HRDashboardOverviewView(generics.RetrieveAPIView):
    """
    API endpoint для получения общего обзора HR-дашборда
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = HRDashboardOverviewSerializer

    @extend_schema(
        description="Получение общего обзора метрик HR-дашборда",
        responses={
            200: HRDashboardOverviewSerializer,
            401: OpenApiResponse(description="Ошибка аутентификации"),
            403: OpenApiResponse(description="Недостаточно прав доступа"),
        }
    )
    def get(self, request, *args, **kwargs):
        metrics = HRDashboardAggregatorService.collect_metrics()
        serializer = self.get_serializer(metrics)
        return Response(serializer.data)


class DepartmentMetricsView(generics.ListAPIView):
    """
    API endpoint для получения метрик по департаментам
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = DepartmentMetricsSerializer

    @extend_schema(
        description="Получение метрик по всем департаментам",
        responses={
            200: DepartmentMetricsSerializer(many=True),
            401: OpenApiResponse(description="Ошибка аутентификации"),
            403: OpenApiResponse(description="Недостаточно прав доступа"),
        }
    )
    def get_queryset(self):
        return Department.objects.annotate(
            active_employees=Count(
                'users',
                filter=Q(users__onboarding_assignments__status='active')
            ),
            completed_employees=Count(
                'users',
                filter=Q(users__onboarding_assignments__status='completed')
            ),
            avg_sentiment=Avg(
                'users__feedback_given__sentiment_score',
                filter=Q(users__feedback_given__created_at__gte=timezone.now(
                ) - timezone.timedelta(days=30))
            )
        ).values(
            'id',
            'name',
            'active_employees',
            'completed_employees',
            'avg_sentiment'
        )


class HRAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления HR-алертами
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = HRAlertSerializer
    queryset = HRAlert.objects.all()
    filterset_fields = ['status', 'severity', 'department']
    ordering_fields = ['created_at', 'updated_at', 'severity']
    ordering = ['-created_at']

    @extend_schema(
        description="Получение списка HR-алертов с фильтрацией",
        parameters=[
            OpenApiParameter(
                name="status",
                description="Фильтр по статусу алерта",
                required=False,
                type=str,
                enum=HRAlert.Status.choices
            ),
            OpenApiParameter(
                name="severity",
                description="Фильтр по уровню важности",
                required=False,
                type=str,
                enum=HRAlertRule.Severity.choices
            ),
        ],
        responses={
            200: HRAlertSerializer(many=True),
            401: OpenApiResponse(description="Ошибка аутентификации"),
            403: OpenApiResponse(description="Недостаточно прав доступа"),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    @extend_schema(
        description="Отметить алерт как решенный",
        request=None,
        responses={
            200: HRAlertSerializer,
            401: OpenApiResponse(description="Ошибка аутентификации"),
            403: OpenApiResponse(description="Недостаточно прав доступа"),
            404: OpenApiResponse(description="Алерт не найден"),
        }
    )
    def resolve(self, request, pk=None):
        alert = self.get_object()
        notes = request.data.get('notes', '')
        alert.resolve(request.user, notes)
        serializer = self.get_serializer(alert)
        return Response(serializer.data)


class HRAlertRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления правилами HR-алертов
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = HRAlertRuleSerializer
    queryset = HRAlertRule.objects.all()
    filterset_fields = ['severity', 'is_active']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    @extend_schema(
        description="Получение списка правил для HR-алертов",
        parameters=[
            OpenApiParameter(
                name="is_active",
                description="Фильтр по активности правила",
                required=False,
                type=bool
            ),
            OpenApiParameter(
                name="severity",
                description="Фильтр по уровню важности",
                required=False,
                type=str,
                enum=HRAlertRule.Severity.choices
            ),
        ],
        responses={
            200: HRAlertRuleSerializer(many=True),
            401: OpenApiResponse(description="Ошибка аутентификации"),
            403: OpenApiResponse(description="Недостаточно прав доступа"),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class HRMetricSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра снэпшотов метрик
    """
    permission_classes = [IsAuthenticated, IsAdminOrHR]
    serializer_class = HRMetricSnapshotSerializer
    queryset = HRMetricSnapshot.objects.all()
    filterset_fields = ['metric_key', 'department']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    @extend_schema(
        description="Получение истории метрик с фильтрацией",
        parameters=[
            OpenApiParameter(
                name="metric_key",
                description="Фильтр по ключу метрики",
                required=False,
                type=str
            ),
            OpenApiParameter(
                name="department",
                description="Фильтр по ID департамента",
                required=False,
                type=int
            ),
        ],
        responses={
            200: HRMetricSnapshotSerializer(many=True),
            401: OpenApiResponse(description="Ошибка аутентификации"),
            403: OpenApiResponse(description="Недостаточно прав доступа"),
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
