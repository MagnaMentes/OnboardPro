# filepath: /app/backend/notifications/views.py
from django.utils import timezone
from rest_framework import status, filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from .models import Notification, NotificationType
from .serializers import NotificationSerializer, NotificationSettingsSerializer
from .services import NotificationService


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с уведомлениями пользователя.

    Поддерживаемые операции:
    - GET /api/notifications/ - получение списка своих уведомлений с фильтрацией
    - GET /api/notifications/{id}/ - получение деталей одного уведомления
    - POST /api/notifications/{id}/read/ - отметка уведомления как прочитанное
    - POST /api/notifications/read-all/ - отметка всех уведомлений как прочитанные
    - DELETE /api/notifications/{id}/ - удаление уведомления
    - GET /api/notifications/settings/ - получение настроек уведомлений
    - POST /api/notifications/settings/ - обновление настроек уведомлений
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'notification_type']
    ordering = ['-created_at']

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="type",
                description="Фильтр по типу уведомления (info, warning, deadline, system)",
                required=False,
                type=str,
                enum=["info", "warning", "deadline", "system"]
            ),
            OpenApiParameter(
                name="is_read",
                description="Фильтр по статусу прочтения (true, false)",
                required=False,
                type=str,
                enum=["true", "false"]
            ),
            OpenApiParameter(
                name="created_after",
                description="Фильтр по дате создания (после указанной даты, формат YYYY-MM-DD)",
                required=False,
                type=str
            ),
            OpenApiParameter(
                name="created_before", 
                description="Фильтр по дате создания (до указанной даты, формат YYYY-MM-DD)",
                required=False,
                type=str
            ),
        ],
        responses={
            200: OpenApiResponse(description="Список уведомлений с учетом фильтров"),
        }
    )
    def get_queryset(self):
        """
        Возвращает только уведомления текущего пользователя
        с применением указанных фильтров
        """
        queryset = Notification.objects.filter(recipient=self.request.user)

        # Фильтр по типу уведомления
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)

        # Фильтр по статусу прочтения
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            is_read_value = str(is_read).lower() == 'true'
            queryset = queryset.filter(is_read=is_read_value)

        # Фильтр по дате создания (после указанной даты)
        created_after = self.request.query_params.get('created_after')
        if created_after:
            try:
                queryset = queryset.filter(created_at__gte=created_after)
            except ValueError:
                pass

        # Фильтр по дате создания (до указанной даты)
        created_before = self.request.query_params.get('created_before')
        if created_before:
            try:
                queryset = queryset.filter(created_at__lte=created_before)
            except ValueError:
                pass

        return queryset

    @extend_schema(
        description="Отметка уведомления как прочитанное",
        responses={
            200: OpenApiResponse(description="Уведомление отмечено как прочитанное"),
            404: OpenApiResponse(description="Уведомление не найдено"),
        }
    )
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """
        Отмечает уведомление как прочитанное
        """
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @extend_schema(
        description="Отметка всех уведомлений как прочитанные",
        responses={
            200: OpenApiResponse(description="Все уведомления отмечены как прочитанные"),
        }
    )
    @action(detail=False, methods=['post'])
    def read_all(self, request):
        """
        Отмечает все уведомления пользователя как прочитанные
        """
        count = NotificationService.mark_all_as_read(request.user)
        return Response({
            'message': f'Отмечено {count} уведомлений как прочитанные',
            'count': count
        })

    @extend_schema(
        description="Получение и обновление настроек уведомлений пользователя",
        request=NotificationSettingsSerializer,
        responses={
            200: OpenApiResponse(description="Настройки уведомлений пользователя"),
            400: OpenApiResponse(description="Ошибка валидации"),
        }
    )
    @action(detail=False, methods=['get', 'post'])
    def settings(self, request):
        """
        Получает или обновляет настройки уведомлений текущего пользователя
        в зависимости от HTTP-метода запроса
        """
        if request.method == 'GET':
            user = request.user
            settings = {
                'info': user.notification_settings.get('info', True) if user.notification_settings else True,
                'warning': user.notification_settings.get('warning', True) if user.notification_settings else True,
                'deadline': user.notification_settings.get('deadline', True) if user.notification_settings else True,
                'system': user.notification_settings.get('system', True) if user.notification_settings else True,
            }
            return Response(settings)
        else:  # POST
            serializer = NotificationSettingsSerializer(data=request.data)
            if serializer.is_valid():
                user = request.user

                if not user.notification_settings:
                    user.notification_settings = {}

                for notification_type in ['info', 'warning', 'deadline', 'system']:
                    if notification_type in serializer.validated_data:
                        user.notification_settings[notification_type] = serializer.validated_data[notification_type]

                user.save(update_fields=['notification_settings'])

                return Response({
                    'message': 'Настройки уведомлений обновлены',
                    'settings': user.notification_settings
                })

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
