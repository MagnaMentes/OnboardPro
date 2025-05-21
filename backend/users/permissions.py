from rest_framework import permissions
from .models import UserRole


class IsAdmin(permissions.BasePermission):
    """
    Разрешение только для администраторов
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN


class IsHR(permissions.BasePermission):
    """
    Разрешение только для HR-менеджеров
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.HR


class IsManager(permissions.BasePermission):
    """
    Разрешение только для менеджеров
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.MANAGER


class IsAdminOrHR(permissions.BasePermission):
    """
    Разрешение для администраторов или HR-менеджеров
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == UserRole.ADMIN or
            request.user.role == UserRole.HR
        )


class IsAdminOrManager(permissions.BasePermission):
    """
    Разрешение для администраторов или менеджеров
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == UserRole.ADMIN or
            request.user.role == UserRole.MANAGER
        )
