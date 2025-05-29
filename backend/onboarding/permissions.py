from rest_framework import permissions
from users.models import UserRole


class IsAssignedUserOrHRorAdmin(permissions.BasePermission):
    """
    Разрешение для доступа к назначенной программе или её элементам.
    Доступ разрешен:
    1. Пользователю, которому назначена программа
    2. HR-менеджерам
    3. Администраторам

    Класс поддерживает проверку разрешений для разных типов объектов:
    - Объекты с прямой связью с пользователем (атрибут user)
    - OnboardingStep - проверяем через назначение программы пользователям
    """

    def has_object_permission(self, request, view, obj):
        # Проверяем, что пользователь аутентифицирован
        if not request.user or not request.user.is_authenticated:
            return False

        # HR или Admin имеют доступ ко всем объектам
        if request.user.role in [UserRole.ADMIN, UserRole.HR]:
            return True

        # Если объект имеет прямую связь с пользователем
        if hasattr(obj, 'user'):
            return obj.user == request.user

        # Для OnboardingStep проверяем через UserOnboardingAssignment
        from .models import OnboardingStep, UserOnboardingAssignment
        if isinstance(obj, OnboardingStep):
            # Проверяем, назначена ли программа данного шага пользователю
            return UserOnboardingAssignment.objects.filter(
                user=request.user,
                program=obj.program,
                status='active'
            ).exists()

        return False


class IsAssignedUser(permissions.BasePermission):
    """
    Разрешение для доступа к объектам, связанным с пользователем.
    Доступ разрешен:
    1. Пользователю, которому назначена встреча
    2. HR-менеджерам
    3. Администраторам
    """

    def has_object_permission(self, request, view, obj):
        # Проверяем, что пользователь аутентифицирован
        if not request.user or not request.user.is_authenticated:
            return False

        # HR или Admin имеют доступ ко всем объектам
        if request.user.role in [UserRole.ADMIN, UserRole.HR]:
            return True

        # Для VirtualMeetingSlot проверяем assigned_user
        if hasattr(obj, 'assigned_user'):
            return obj.assigned_user == request.user

        return False
