# This file makes feedback.views a Python package

# Импортируем классы представлений прямо из корневого модуля feedback
from .dashboard_views import *
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from ..models import FeedbackTemplate, FeedbackQuestion, UserFeedback, FeedbackInsight
from ..serializers import (
    FeedbackTemplateListSerializer, FeedbackTemplateDetailSerializer,
    UserFeedbackCreateSerializer, UserFeedbackListSerializer,
    UserFeedbackDetailSerializer, FeedbackInsightSerializer
)
from users.permissions import IsAdminOrHR
from ..services.ai_insights_service import FeedbackAIInsightsService


class FeedbackTemplateViewSet(viewsets.ModelViewSet):
    """
    API для управления шаблонами обратной связи
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'is_anonymous']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        return FeedbackTemplate.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return FeedbackTemplateDetailSerializer
        return FeedbackTemplateDetailSerializer

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)


class UserFeedbackViewSet(viewsets.ModelViewSet):
    """
    API для управления записями обратной связи пользователей
    """
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['template', 'user', 'onboarding_step', 'is_anonymous']
    search_fields = ['template__title', 'user__email']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user

        # Админы и HR видят все отзывы
        if user.is_staff or user.role in ['admin', 'hr']:
            return UserFeedback.objects.all()

        # Остальные пользователи видят только свои отзывы и отзывы о себе,
        # если они не анонимные
        return UserFeedback.objects.filter(
            user=user
        ) | UserFeedback.objects.filter(
            submitter=user, is_anonymous=False
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return UserFeedbackCreateSerializer
        elif self.action == 'list':
            return UserFeedbackListSerializer
        return UserFeedbackDetailSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdminOrHR()]

    def perform_create(self, serializer):
        # Если submitter не указан, устанавливаем текущего пользователя
        if not serializer.validated_data.get('submitter'):
            serializer.save(submitter=self.request.user)
        else:
            serializer.save()

        # После сохранения отзыва запускаем AI-анализ
        user_feedback = serializer.instance
        FeedbackAIInsightsService.analyze_feedback(user_feedback)


class FeedbackInsightsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для просмотра AI-анализа обратной связи
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    serializer_class = FeedbackInsightSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'feedback', 'template']
    ordering_fields = ['created_at', 'confidence_score']
    ordering = ['-created_at']

    def get_queryset(self):
        return FeedbackInsight.objects.all()

    @extend_schema(
        summary="Запуск анализа обратной связи",
        description="Ручной запуск AI-анализа обратной связи",
        responses={
            200: OpenApiResponse(description="Анализ успешно запущен"),
            400: OpenApiResponse(description="Ошибка при запуске анализа"),
        }
    )
    @action(detail=False, methods=['post'])
    def run_analysis(self, request):
        try:
            # Запускаем анализ всей обратной связи
            feedback_without_insights = UserFeedback.objects.filter(
                insights__isnull=True)

            for feedback in feedback_without_insights:
                FeedbackAIInsightsService.analyze_feedback(feedback)

            # Запускаем анализ агрегированных данных по шаблонам
            templates = FeedbackTemplate.objects.all()
            for template in templates:
                FeedbackAIInsightsService.analyze_template_feedback(template)

            return Response({
                "detail": f"Анализ запущен для {feedback_without_insights.count()} записей обратной связи и {templates.count()} шаблонов."
            })
        except Exception as e:
            return Response({
                "detail": f"Ошибка при запуске анализа: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)


# Также импортируем представления из dashboard_views
