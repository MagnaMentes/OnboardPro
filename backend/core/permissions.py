from rest_framework import permissions


class RoleBasedPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = getattr(view, 'required_role', None)
        return role is None or request.user.role == role
