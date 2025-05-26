from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import UserStepProgress
from .serializers import UserStepProgressSerializer
from .filters import UserStepProgressFilter
from .permissions import IsAssignedUserOrHRorAdmin


class UserStepProgressListView(generics.ListAPIView):
    """
    Представление для получения списка прогресса по шагам онбординга
    """
    serializer_class = UserStepProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = UserStepProgressFilter
    ordering_fields = ['step__order', 'status', 'completed_at',
                       'planned_date_start', 'planned_date_end']
    ordering = ['step__order']

    def get_queryset(self):
        # Пользователи могут видеть только свой прогресс,
        # HR и Admin могут видеть прогресс всех
        user = self.request.user
        queryset = UserStepProgress.objects.select_related('step', 'user')

        # Фильтрация по ID пользователя (доступно только HR и Admin)
        user_id = self.request.query_params.get('user_id')
        if user_id and user.is_staff:
            return queryset.filter(user_id=user_id)

        # Фильтрация по ID программы
        program_id = self.request.query_params.get('program_id')
        if program_id:
            queryset = queryset.filter(step__program_id=program_id)

        # Обычные пользователи видят только свой прогресс
        if not user.is_staff:
            queryset = queryset.filter(user=user)

        return queryset
