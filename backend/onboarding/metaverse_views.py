from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import VirtualMeetingSlot
from .metaverse_serializers import VirtualMeetingSlotSerializer
from users.permissions import IsAdminOrHR
from .permissions import IsAssignedUser


class VirtualMeetingSlotListCreateView(generics.ListCreateAPIView):
    """
    Представление для просмотра и создания виртуальных встреч
    """
    serializer_class = VirtualMeetingSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Возвращает встречи для текущего пользователя
        HR и admin могут видеть все
        """
        user = self.request.user

        # Для HR и админов показываем все слоты
        if user.role in ['admin', 'hr']:
            return VirtualMeetingSlot.objects.all().order_by('start_time')

        # Для обычных пользователей показываем только их слоты
        return VirtualMeetingSlot.objects.filter(assigned_user=user).order_by('start_time')

    def perform_create(self, serializer):
        """
        Только HR и admin могут создавать встречи
        """
        user = self.request.user
        if user.role not in ['admin', 'hr']:
            raise ValidationError(
                "Только HR и администраторы могут создавать встречи.")
        serializer.save()


class VirtualMeetingSlotDetailView(generics.RetrieveDestroyAPIView):
    """
    Представление для просмотра деталей и удаления виртуальной встречи
    """
    queryset = VirtualMeetingSlot.objects.all()
    serializer_class = VirtualMeetingSlotSerializer

    def get_permissions(self):
        """
        Разные права для разных методов:
        - GET: пользователь должен быть назначен или HR/admin
        - DELETE: только HR/admin
        """
        if self.request.method == 'DELETE':
            return [permissions.IsAuthenticated(), IsAdminOrHR()]
        return [permissions.IsAuthenticated(), IsAssignedUser()]

    def check_object_permissions(self, request, obj):
        """
        Проверяем права доступа к конкретному объекту
        """
        # Вызываем стандартную проверку прав из permissions_classes
        for permission in self.get_permissions():
            if not permission.has_object_permission(request, self, obj):
                self.permission_denied(
                    request, message=getattr(permission, 'message', None)
                )
