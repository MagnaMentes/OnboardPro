from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from .models import User
from .permissions import IsAdminOrHR
from .serializers import UserSerializer


@extend_schema(
    tags=["Admin Dashboard"],
    summary="Получение списка всех пользователей",
    description="API для получения списка всех пользователей с возможностью фильтрации по роли, статусу и поиска по имени/email.",
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
    Поддерживает фильтрацию по роли, статусу и поиск по имени/email.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'full_name']

    def get_queryset(self):
        """
        Возвращает QuerySet всех пользователей с возможностью фильтрации.
        """
        queryset = User.objects.all().order_by('role', 'full_name')

        # Дополнительная фильтрация по параметрам запроса, если есть
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) | Q(email__icontains=search)
            )

        return queryset
