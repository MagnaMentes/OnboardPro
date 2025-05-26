from rest_framework import generics, permissions, filters
from rest_framework.response import Response
from django.db.models import Count, Avg, Case, When, Value, CharField, Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from .models import UserOnboardingAssignment, OnboardingStep, UserStepProgress
from .feedback_models import FeedbackMood, StepFeedback
from users.permissions import IsAdminOrHR
from .serializers import UserOnboardingAssignmentSerializer
from .feedback_serializers import StepFeedbackSerializer


@extend_schema(
    tags=["Admin Dashboard"],
    summary="Получение списка всех назначений",
    description="API для получения списка всех назначений с вложенной информацией о прогрессе.",
    parameters=[
        OpenApiParameter(
            name="status",
            description="Фильтр по статусу назначения",
            required=False,
            type=str,
            enum=["active", "completed"]
        ),
    ],
    responses={
        200: OpenApiResponse(description="Список назначений с прогрессом"),
        401: OpenApiResponse(description="Ошибка аутентификации"),
        403: OpenApiResponse(description="Недостаточно прав доступа"),
    }
)
class AdminAssignmentsListView(generics.ListAPIView):
    """
    Представление для получения списка всех назначений с прогрессом (только для HR и Admin).
    """
    serializer_class = UserOnboardingAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        """
        Возвращает QuerySet всех назначений с оптимизацией запросов через prefetch_related.
        """
        return UserOnboardingAssignment.objects.all().select_related(
            'user', 'program'
        ).prefetch_related(
            'user__step_progress'
        ).order_by('-assigned_at')


@extend_schema(
    tags=["Admin Dashboard"],
    summary="Получение списка отзывов",
    description="API для получения списка последних отзывов с фильтрацией по тональности.",
    parameters=[
        OpenApiParameter(
            name="sentiment",
            description="Фильтр по тональности отзыва",
            required=False,
            type=str,
            enum=["positive", "neutral", "negative"]
        ),
        OpenApiParameter(
            name="auto_tag",
            description="Фильтр по автотегу",
            required=False,
            type=str,
            enum=["positive", "neutral", "negative",
                  "unclear_instruction", "delay_warning"]
        ),
        OpenApiParameter(
            name="limit",
            description="Ограничение количества записей",
            required=False,
            type=int
        ),
    ],
    responses={
        200: OpenApiResponse(description="Список отзывов"),
        401: OpenApiResponse(description="Ошибка аутентификации"),
        403: OpenApiResponse(description="Недостаточно прав доступа"),
    }
)
class AdminFeedbacksListView(generics.ListAPIView):
    """
    Представление для получения списка последних отзывов (только для HR и Admin).
    Поддерживает фильтрацию по тональности и автотегам.
    """
    serializer_class = StepFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['auto_tag']

    def get_queryset(self):
        """
        Возвращает QuerySet отзывов с возможностью фильтрации по тональности.
        """
        queryset = StepFeedback.objects.all().select_related(
            'user', 'step', 'assignment'
        ).order_by('-created_at')

        # Фильтрация по тональности
        sentiment = self.request.query_params.get('sentiment')
        if sentiment == 'positive':
            queryset = queryset.filter(sentiment_score__gt=0.3)
        elif sentiment == 'negative':
            queryset = queryset.filter(sentiment_score__lt=-0.3)
        elif sentiment == 'neutral':
            queryset = queryset.filter(
                sentiment_score__gte=-0.3, sentiment_score__lte=0.3)

        # Ограничение количества записей
        limit = self.request.query_params.get('limit')
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except (TypeError, ValueError):
                pass

        return queryset
