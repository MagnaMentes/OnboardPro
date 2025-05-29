from django.contrib import admin
from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description', 'manager__email')
    raw_id_fields = ('manager',)
