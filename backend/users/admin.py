from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User
from .department_models import Department


class CustomUserAdmin(UserAdmin):
    """Кастомная админка для модели пользователя"""
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        (_('Personal info'), {
         'fields': ('full_name', 'position', 'department')}),
        (_('Role'), {'fields': ('role',)}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {
         'fields': ('last_login', 'date_joined', 'created_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'role', 'is_staff', 'is_superuser'),
        }),
    )
    list_display = ('email', 'username', 'full_name',
                    'role', 'is_active', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'role', 'groups')
    search_fields = ('username', 'full_name', 'email', 'position')
    ordering = ('email',)
    readonly_fields = ('created_at',)


admin.site.register(User, CustomUserAdmin)
