from rest_framework import permissions
from users.models import UserRole


class IsAssignedUserOrHRorAdmin(permissions.BasePermission):
    """
    Разрешение для доступа к назначенной программе.
    Доступ разрешен:
    1. Пользователю, которому назначена программа
    2. HR-менеджерам
    3. Администраторам
    """

    def has_object_permission(self, request, view, obj):
        # Проверяем, что пользователь аутентифицирован
        if not request.user or not request.user.is_authenticated:
            return False

        # Пользователь, которому назначена программа
        if obj.user == request.user:
            return True

        # HR или Admin
        return request.user.role in [UserRole.ADMIN, UserRole.HR]
