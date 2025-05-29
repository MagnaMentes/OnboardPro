from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Department
from .serializers import DepartmentSerializer
from users.permissions import IsAdminOrHR


class DepartmentList(generics.ListCreateAPIView):
    """
    API для получения списка всех департаментов и создания новых
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]

    def get_queryset(self):
        """Фильтрация по активным департаментам"""
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')

        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)

        return queryset


class DepartmentDetail(generics.RetrieveUpdateAPIView):
    """
    API для получения, изменения и удаления конкретного департамента
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]
