from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    """Сериализатор для модели департамента"""
    manager_name = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'manager', 'manager_name',
                  'is_active', 'created_at', 'employee_count']

    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.full_name or obj.manager.email
        return None

    def get_employee_count(self, obj):
        return obj.employees.count()
