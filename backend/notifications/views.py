from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
from .services import NotificationService


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для работы с уведомлениями пользователя.

    Поддерживаемые операции:
    - GET /api/notifications/ - получение списка своих уведомлений
    - GET /api/notifications/{id}/ - получение деталей одного уведомления
    - POST /api/notifications/{id}/read/ - отметка уведомления как прочитанное
    - POST /api/notifications/read-all/ - отметка всех уведомлений как прочитанные
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Возвращает только уведомления текущего пользователя
        """
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """
        Отмечает уведомление как прочитанное
        """
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        """
        Отмечает все уведомления пользователя как прочитанные
        """
        count = NotificationService.mark_all_as_read(request.user)
        return Response({
            'message': f'Marked {count} notifications as read',
            'count': count
        })
