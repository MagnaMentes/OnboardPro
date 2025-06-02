from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Count, Q

from .insights_models import AIInsightV2, InsightTag
from .recommendations_models import AIRecommendationV2
from .serializers import (
    AIInsightV2Serializer,
    AIInsightDetailV2Serializer,
    AIRecommendationV2Serializer,
    AIRecommendationDetailV2Serializer,
    InsightTagSerializer
)
from django.contrib.auth import get_user_model
from .smart_insights_service import SmartInsightsAggregatorService

User = get_user_model()
from .recommendation_engine_v2 import AIRecommendationEngineV2


class AIInsightViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для работы с AI-инсайтами.

    * `list` - получение списка всех инсайтов
    * `retrieve` - получение детальной информации об инсайте
    * `resolve` - разрешение инсайта
    * `dismiss` - отклонение инсайта
    * `acknowledge` - подтверждение инсайта
    * `mark_in_progress` - отметка инсайта как "в прогрессе"
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['insight_type', 'level', 'status',
                        'source', 'user', 'department', 'step', 'assignment']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'resolved_at', 'level']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Возвращает список инсайтов с фильтрацией по тегам, если они указаны.
        """
        queryset = AIInsightV2.objects.all()

        # Фильтрация по тегам (ids или slugs)
        tag_ids = self.request.query_params.getlist('tag_id', None)
        tag_slugs = self.request.query_params.getlist('tag_slug', None)

        if tag_ids:
            queryset = queryset.filter(tags__id__in=tag_ids).distinct()

        if tag_slugs:
            queryset = queryset.filter(tags__slug__in=tag_slugs).distinct()

        return queryset

    def get_serializer_class(self):
        """
        Возвращает детальный сериализатор для retrieve,
        обычный для остальных действий.
        """
        if self.action == 'retrieve':
            return AIInsightDetailV2Serializer
        return AIInsightV2Serializer

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Разрешение инсайта
        """
        insight = self.get_object()
        insight.resolve()
        serializer = self.get_serializer(insight)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """
        Отклонение инсайта
        """
        insight = self.get_object()
        insight.dismiss()
        serializer = self.get_serializer(insight)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """
        Подтверждение инсайта
        """
        insight = self.get_object()
        insight.acknowledge()
        serializer = self.get_serializer(insight)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_in_progress(self, request, pk=None):
        """
        Отметка инсайта как "в прогрессе"
        """
        insight = self.get_object()
        insight.mark_in_progress()
        serializer = self.get_serializer(insight)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def aggregate(self, request):
        """
        Запуск сбора и агрегации инсайтов из всех источников
        """
        count = SmartInsightsAggregatorService.aggregate_all_insights()
        return Response({"message": f"Собрано и обработано {count} инсайтов"})

    @action(detail=False)
    def by_user(self, request):
        """
        Получение списка инсайтов для конкретного пользователя
        """
        user_id = request.query_params.get('user_id', None)
        if not user_id:
            return Response(
                {"error": "Параметр user_id обязателен"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(user=user_id)
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False)
    def by_department(self, request):
        """
        Получение списка инсайтов для конкретного отдела
        """
        department_id = request.query_params.get('department_id', None)
        if not department_id:
            return Response(
                {"error": "Параметр department_id обязателен"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(department=department_id)
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AIRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для работы с AI-рекомендациями v2.

    * `list` - получение списка всех рекомендаций
    * `retrieve` - получение детальной информации о рекомендации
    * `accept` - принятие рекомендации
    * `reject` - отклонение рекомендации
    * `generate` - генерация новых рекомендаций для пользователя
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['recommendation_type', 'status',
                        'priority', 'user', 'assignment', 'step']
    search_fields = ['title', 'recommendation_text', 'reason']
    ordering_fields = ['generated_at', 'expires_at', 'resolved_at', 'priority']
    ordering = ['-priority', '-generated_at']

    def get_queryset(self):
        """
        Возвращает список рекомендаций с фильтрацией по тегам, если они указаны.
        """
        # По умолчанию возвращаем активные рекомендации, если не запрошены все
        show_all = self.request.query_params.get(
            'show_all', 'false').lower() == 'true'

        if show_all:
            queryset = AIRecommendationV2.objects.all()
        else:
            queryset = AIRecommendationV2.objects.filter(
                status=AIRecommendationV2.RecommendationStatus.ACTIVE
            )

        # Фильтрация по тегам (ids или slugs)
        tag_ids = self.request.query_params.getlist('tag_id', None)
        tag_slugs = self.request.query_params.getlist('tag_slug', None)

        if tag_ids:
            queryset = queryset.filter(tags__id__in=tag_ids).distinct()

        if tag_slugs:
            queryset = queryset.filter(tags__slug__in=tag_slugs).distinct()

        return queryset

    def get_serializer_class(self):
        """
        Возвращает детальный сериализатор для retrieve,
        обычный для остальных действий.
        """
        if self.action == 'retrieve':
            return AIRecommendationDetailV2Serializer
        return AIRecommendationV2Serializer

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        Принятие рекомендации с возможностью указания причины
        """
        reason = request.data.get('reason', None)
        success, message = AIRecommendationEngineV2.accept_recommendation(
            pk, reason, request.user)

        if success:
            recommendation = self.get_object()
            serializer = self.get_serializer(recommendation)
            return Response(serializer.data)
        else:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Отклонение рекомендации с возможностью указания причины
        """
        reason = request.data.get('reason', None)
        success, message = AIRecommendationEngineV2.reject_recommendation(
            pk, reason, request.user)

        if success:
            recommendation = self.get_object()
            serializer = self.get_serializer(recommendation)
            return Response(serializer.data)
        else:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Генерация рекомендаций для указанного пользователя
        """
        user_id = request.data.get('user_id', None)

        if not user_id:
            return Response(
                {"error": "Параметр user_id обязателен"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
            count = AIRecommendationEngineV2.generate_recommendations_for_user(
                user)
            return Response({"message": f"Создано {count} новых рекомендаций"})
        except User.DoesNotExist:
            return Response(
                {"error": f"Пользователь с id={user_id} не найден"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def generate_all(self, request):
        """
        Генерация рекомендаций для всех активных пользователей
        """
        count = AIRecommendationEngineV2.generate_all_recommendations()
        return Response({"message": f"Создано {count} новых рекомендаций"})

    @action(detail=False)
    def by_user(self, request):
        """
        Получение списка рекомендаций для конкретного пользователя
        """
        user_id = request.query_params.get('user_id', None)
        if not user_id:
            return Response(
                {"error": "Параметр user_id обязателен"},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = self.get_queryset().filter(user=user_id)
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class InsightTagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для просмотра тегов инсайтов
    """
    queryset = InsightTag.objects.all()
    serializer_class = InsightTagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'description']


# Добавляем отсутствующие функции статистики
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_insight_stats(request):
    """
    Получение статистики по инсайтам
    """
    total = AIInsightV2.objects.count()
    new = AIInsightV2.objects.filter(status='new').count()
    acknowledged = AIInsightV2.objects.filter(status='acknowledged').count()
    in_progress = AIInsightV2.objects.filter(status='in_progress').count()
    resolved = AIInsightV2.objects.filter(status='resolved').count()
    dismissed = AIInsightV2.objects.filter(status='dismissed').count()

    tag_stats = InsightTag.objects.annotate(
        insight_count=Count('aiinsightv2')
    ).values('name', 'category', 'insight_count')

    return Response({
        'total': total,
        'by_status': {
            'new': new,
            'acknowledged': acknowledged,
            'in_progress': in_progress,
            'resolved': resolved,
            'dismissed': dismissed,
        },
        'by_tag': list(tag_stats)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_recommendation_stats(request):
    """
    Получение статистики по рекомендациям
    """
    total = AIRecommendationV2.objects.count()
    new = AIRecommendationV2.objects.filter(status='new').count()
    viewed = AIRecommendationV2.objects.filter(status='viewed').count()
    applied = AIRecommendationV2.objects.filter(status='applied').count()
    dismissed = AIRecommendationV2.objects.filter(status='dismissed').count()

    # Статистика по пользователям
    users_with_recommendations = AIRecommendationV2.objects.values(
        'user').distinct().count()

    # Эффективность рекомендаций
    efficiency = round((applied / total * 100), 1) if total > 0 else 0

    return Response({
        'total': total,
        'by_status': {
            'new': new,
            'viewed': viewed,
            'applied': applied,
            'dismissed': dismissed
        },
        'users_with_recommendations': users_with_recommendations,
        'efficiency': efficiency
    })
