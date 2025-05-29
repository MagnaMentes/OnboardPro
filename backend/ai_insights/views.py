from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.generics import get_object_or_404
from .models import AIInsight, AIRecommendation
from .serializers import AIInsightSerializer, AIRecommendationSerializer
from .services import AIInsightService, AIRecommendationService


class IsHROrAdmin(permissions.BasePermission):
    """
    Проверка, является ли пользователь HR или Admin
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['hr', 'admin']


class AIInsightViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для управления AI-инсайтами
    """
    queryset = AIInsight.objects.all().order_by('-created_at')
    serializer_class = AIInsightSerializer
    permission_classes = [IsHROrAdmin]

    def get_queryset(self):
        """
        Фильтрация объектов по запросу
        """
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_insights(self, request, user_id=None):
        """
        Получение инсайтов для конкретного пользователя
        """
        insights = AIInsightService.get_insights_for_user(user_id)
        serializer = self.get_serializer(insights, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='analyze/(?P<assignment_id>[^/.]+)')
    def analyze_assignment(self, request, assignment_id=None):
        """
        Ручной запуск анализа для конкретного назначения
        """
        from onboarding.models import UserOnboardingAssignment
        assignment = get_object_or_404(
            UserOnboardingAssignment, pk=assignment_id)
        insight = AIInsightService.analyze_onboarding_progress(assignment)
        serializer = self.get_serializer(insight)
        return Response(serializer.data)


class AIRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для управления AI-рекомендациями.
    Доступ только для HR и Admin.
    """
    queryset = AIRecommendation.objects.all()
    serializer_class = AIRecommendationSerializer
    permission_classes = [IsHROrAdmin]

    def get_queryset(self):
        """
        Получение активных рекомендаций с возможностью фильтрации по пользователю
        """
        queryset = AIRecommendationService.get_active_recommendations()

        # Фильтрация по пользователю, если указан параметр user_id
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        return queryset

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """
        POST /api/recommendations/{id}/dismiss/
        Скрывает рекомендацию.
        """
        success = AIRecommendationService.dismiss_recommendation(
            recommendation_id=pk)
        if success:
            return Response({"status": "Рекомендация успешно скрыта"})
        return Response(
            {"status": "Ошибка", "message": "Рекомендация не найдена"},
            status=status.HTTP_404_NOT_FOUND
        )
