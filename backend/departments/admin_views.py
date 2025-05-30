from rest_framework import generics, permissions, serializers
from rest_framework.response import Response
from django.db.models import Count, Avg, F, Q, Case, When, FloatField
from django.db import models
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from .models import Department
from users.permissions import IsAdminOrHR
from .serializers import DepartmentSerializer


class DepartmentSummarySerializer(DepartmentSerializer):
    """
    Расширенный сериализатор для получения аналитики по департаментам
    """
    class Meta(DepartmentSerializer.Meta):
        fields = DepartmentSerializer.Meta.fields + \
            ['avg_progress', 'risk_level', 'completion_rate']

    avg_progress = serializers.FloatField(default=0)
    risk_level = serializers.FloatField(default=0)
    completion_rate = serializers.FloatField(default=0)


@extend_schema(
    tags=["Admin Dashboard"],
    summary="Получение аналитики по департаментам",
    description="API для получения списка всех департаментов с аналитической информацией о сотрудниках и прогрессе онбординга",
    parameters=[
        OpenApiParameter(
            name="is_active",
            description="Фильтр по активным департаментам",
            required=False,
            type=bool
        ),
    ],
    responses={
        200: OpenApiResponse(description="Аналитика по департаментам"),
        401: OpenApiResponse(description="Ошибка аутентификации"),
        403: OpenApiResponse(description="Недостаточно прав доступа"),
    }
)
class DepartmentOverviewView(generics.ListAPIView):
    """
    Представление для получения аналитики по всем департаментам (только для HR и Admin).
    """
    serializer_class = DepartmentSummarySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get_queryset(self):
        """
        Получает список департаментов с аннотациями по среднему прогрессу
        сотрудников, уровню рисков и степени завершения онбординга
        """
        # Базовый QuerySet
        queryset = Department.objects.all()

        # Аннотирование только количества сотрудников
        queryset = queryset.annotate(
            employee_count=Count('employees'),
            # Временно заполняем заглушками, чтобы API работал
            avg_progress=models.Value(0.0, output_field=models.FloatField()),
            risk_level=models.Value(0.0, output_field=models.FloatField()),
            completion_rate=models.Value(0.0, output_field=models.FloatField())
        )

        # Фильтрация по активным департаментам
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)

        return queryset
