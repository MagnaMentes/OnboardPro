from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, F, Case, When, FloatField, IntegerField
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from django.utils import timezone
from .models import User
from .permissions import IsAdminOrHR
from .serializers import UserSerializer
from .analytics_serializers import UserAnalyticsSerializer


@extend_schema(
    tags=["Admin Dashboard"],
    summary="Получение списка всех пользователей",
    description="API для получения списка всех пользователей с возможностью фильтрации по роли, статусу, департаменту и поиска по имени/email.",
    parameters=[
        OpenApiParameter(
            name="role",
            description="Фильтр по роли пользователя",
            required=False,
            type=str,
            enum=["admin", "hr", "manager", "employee"]
        ),
        OpenApiParameter(
            name="is_active",
            description="Фильтр по статусу активности",
            required=False,
            type=bool
        ),
        OpenApiParameter(
            name="department",
            description="Фильтр по департаменту",
            required=False,
            type=int
        ),
        OpenApiParameter(
            name="onboarding_status",
            description="Фильтр по статусу онбординга (not_started, in_progress, completed)",
            required=False,
            type=str,
            enum=["not_started", "in_progress", "completed"]
        ),
        OpenApiParameter(
            name="search",
            description="Поиск по имени или email",
            required=False,
            type=str
        ),
    ],
    responses={
        200: OpenApiResponse(description="Список пользователей"),
        401: OpenApiResponse(description="Ошибка аутентификации"),
        403: OpenApiResponse(description="Недостаточно прав доступа"),
    }
)
class AdminUserListView(generics.ListAPIView):
    """
    Представление для получения списка всех пользователей (только для HR и Admin).
    Поддерживает фильтрацию по роли, статусу, департаменту, статусу онбординга и поиск по имени/email.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'department']
    search_fields = ['email', 'full_name']
    ordering_fields = ['created_at', 'full_name']
    ordering = ['full_name']

    def get_queryset(self):
        """
        Возвращает QuerySet всех пользователей с возможностью фильтрации.
        """
        queryset = User.objects.all().select_related('department')

        # Дополнительная фильтрация по статусу онбординга, если передан
        onboarding_status = self.request.query_params.get(
            'onboarding_status', None)
        if onboarding_status:
            if onboarding_status == 'not_started':
                queryset = queryset.filter(
                    Q(onboardingprogress__isnull=True) | Q(onboardingprogress__progress=0))
            elif onboarding_status == 'in_progress':
                queryset = queryset.filter(
                    onboardingprogress__progress__gt=0, onboardingprogress__progress__lt=100)
            elif onboarding_status == 'completed':
                queryset = queryset.filter(
                    onboardingprogress__progress=100, onboardingprogress__is_completed=True)

        # Дополнительная фильтрация по параметрам запроса, если есть
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) | Q(email__icontains=search)
            )

        return queryset


@extend_schema(
    tags=["Admin Dashboard"],
    summary="Получение подробной аналитики по пользователю",
    description="API для получения детальной аналитической информации о конкретном пользователе: прогресс, тесты, настроение, фидбек",
    responses={
        200: OpenApiResponse(description="Аналитика по пользователю"),
        401: OpenApiResponse(description="Ошибка аутентификации"),
        403: OpenApiResponse(description="Недостаточно прав доступа"),
        404: OpenApiResponse(description="Пользователь не найден"),
    }
)
class UserAnalyticsView(generics.RetrieveAPIView):
    """
    Представление для получения детальной аналитики по конкретному пользователю (только для HR и Admin).
    Включает данные о прогрессе, тестах, наградах, инсайтах AI.
    """
    serializer_class = UserAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get_queryset(self):
        """
        Получает QuerySet пользователя с базовыми предзагрузками без аннотаций.
        """
        # Возвращаем только нужного пользователя без сложных аннотаций
        return User.objects.filter(pk=self.kwargs['pk'])\
                   .select_related('department')\
                   .prefetch_related(
                       'onboarding_assignments',
                       'step_progress',
                       'lms_test_results',
                       'rewards',
                       'ai_insights'
                   )
