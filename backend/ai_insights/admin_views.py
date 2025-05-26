from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from .models import AIInsight, RiskLevel
from .serializers import AIInsightSerializer
from users.permissions import IsAdminOrHR


@extend_schema(
    tags=["Admin Dashboard"],
    summary="Получение списка AI-инсайтов",
    description="API для получения списка AI-инсайтов с фильтрацией по уровню риска.",
    parameters=[
        OpenApiParameter(
            name="risk_level",
            description="Фильтр по уровню риска",
            required=False,
            type=str,
            enum=["high", "medium"]
        ),
        OpenApiParameter(
            name="limit",
            description="Ограничение количества записей",
            required=False,
            type=int
        ),
    ],
    responses={
        200: OpenApiResponse(description="Список AI-инсайтов"),
        401: OpenApiResponse(description="Ошибка аутентификации"),
        403: OpenApiResponse(description="Недостаточно прав доступа"),
    }
)
class AdminInsightsListView(generics.ListAPIView):
    """
    Представление для получения списка AI-инсайтов с высоким или средним риском (только для HR и Admin).
    """
    serializer_class = AIInsightSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['risk_level']

    def get_queryset(self):
        """
        Возвращает QuerySet инсайтов с высоким или средним риском.
        """
        # По умолчанию возвращаем только high и medium риски
        queryset = AIInsight.objects.filter(
            Q(risk_level=RiskLevel.HIGH) | Q(risk_level=RiskLevel.MEDIUM)
        ).select_related('user', 'assignment').order_by('-created_at')

        # Если указан конкретный уровень риска, фильтруем по нему
        risk_level = self.request.query_params.get('risk_level')
        if risk_level in [RiskLevel.HIGH, RiskLevel.MEDIUM]:
            queryset = queryset.filter(risk_level=risk_level)

        # Ограничение количества записей
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except (TypeError, ValueError):
                pass

        return queryset
