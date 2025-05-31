"""
API представления для доступа к Smart Feedback Dashboard
"""
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from ..dashboard_models import FeedbackTrendSnapshot, FeedbackTrendRule, FeedbackTrendAlert
from ..serializers.dashboard_serializers import (
    FeedbackTrendSnapshotSerializer, FeedbackTrendRuleSerializer,
    FeedbackTrendAlertSerializer, FeedbackTrendAlertResolveSerializer
)
from ..services.feedback_trend_services import FeedbackTrendAnalyzerService, FeedbackAlertEngine
from users.permissions import IsAdminOrHR


class FeedbackTrendSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для просмотра исторических срезов трендов обратной связи
    """
    queryset = FeedbackTrendSnapshot.objects.all()
    serializer_class = FeedbackTrendSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['template', 'department', 'date']
    ordering_fields = ['date', 'sentiment_score',
                       'satisfaction_index', 'response_count']
    ordering = ['-date']

    @extend_schema(
        summary="Генерирование исторических срезов трендов",
        description="API для ручного запуска создания срезов трендов обратной связи",
        responses={
            200: OpenApiResponse(description="Количество созданных срезов"),
            403: OpenApiResponse(description="Доступ запрещен"),
        }
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Ручной запуск генерации снимков трендов
        """
        snapshots_created = FeedbackTrendAnalyzerService.create_daily_snapshots()
        return Response({
            'success': True,
            'snapshots_created': snapshots_created,
            'message': f"Успешно создано {snapshots_created} исторических срезов трендов"
        })

    @extend_schema(
        summary="Получение данных для дашборда трендов",
        description="API для получения агрегированных данных для отображения на дашборде",
        parameters=[
            OpenApiParameter(
                name="template_id",
                description="ID шаблона обратной связи",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="department_id",
                description="ID департамента",
                required=False,
                type=int
            ),
            OpenApiParameter(
                name="days",
                description="Количество дней для отображения",
                required=False,
                type=int,
                default=30
            ),
        ],
        responses={
            200: OpenApiResponse(description="Данные для дашборда"),
            400: OpenApiResponse(description="Ошибка в параметрах запроса"),
            403: OpenApiResponse(description="Доступ запрещен"),
        }
    )
    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """
        Получение агрегированных данных для дашборда трендов
        """
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Avg

        # Получаем параметры запроса
        template_id = request.query_params.get('template_id')
        department_id = request.query_params.get('department_id')
        days_str = request.query_params.get('days', '30')

        try:
            days = int(days_str)
            if days <= 0:
                days = 30
        except ValueError:
            days = 30

        # Создаем базовый запрос
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        snapshots = FeedbackTrendSnapshot.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')

        # Применяем фильтры, если они указаны
        if template_id:
            try:
                template_id = int(template_id)
                snapshots = snapshots.filter(template_id=template_id)
            except ValueError:
                pass

        if department_id:
            try:
                department_id = int(department_id)
                snapshots = snapshots.filter(department_id=department_id)
            except ValueError:
                pass

        # Если указаны оба фильтра или не указан ни один,
        # берем более общий срез для сравнения
        comparison_snapshots = None
        if (template_id and department_id) or (not template_id and not department_id):
            # Берем глобальные снимки без фильтров по шаблону и департаменту
            comparison_snapshots = FeedbackTrendSnapshot.objects.filter(
                date__gte=start_date,
                date__lte=end_date,
                template__isnull=True,
                department__isnull=True
            ).order_by('date')
        elif template_id:
            # Если указан только шаблон, сравниваем с глобальными снимками по этому шаблону
            comparison_snapshots = FeedbackTrendSnapshot.objects.filter(
                date__gte=start_date,
                date__lte=end_date,
                template_id=template_id,
                department__isnull=True
            ).order_by('date')
        elif department_id:
            # Если указан только департамент, сравниваем с глобальными снимками по этому департаменту
            comparison_snapshots = FeedbackTrendSnapshot.objects.filter(
                date__gte=start_date,
                date__lte=end_date,
                template__isnull=True,
                department_id=department_id
            ).order_by('date')

        # Агрегируем данные для возврата
        result = {
            'trend_data': {
                'dates': [],
                'sentiment_scores': [],
                'satisfaction_indices': [],
                'response_counts': []
            },
            'comparison_data': {
                'dates': [],
                'sentiment_scores': [],
                'satisfaction_indices': [],
                'response_counts': []
            },
            'summary': {
                'avg_sentiment': 0,
                'avg_satisfaction': 0,
                'total_responses': 0,
                'trend_direction': 'stable'
            },
            'topics_and_issues': {
                'main_topics': {},
                'common_issues': {}
            }
        }

        # Заполняем основные данные тренда
        for snapshot in snapshots:
            result['trend_data']['dates'].append(snapshot.date.isoformat())
            result['trend_data']['sentiment_scores'].append(
                snapshot.sentiment_score)
            result['trend_data']['satisfaction_indices'].append(
                snapshot.satisfaction_index)
            result['trend_data']['response_counts'].append(
                snapshot.response_count)

            # Собираем топики и проблемы
            for topic, value in snapshot.main_topics.items():
                if topic not in result['topics_and_issues']['main_topics']:
                    result['topics_and_issues']['main_topics'][topic] = 0
                try:
                    result['topics_and_issues']['main_topics'][topic] += float(
                        value)
                except (ValueError, TypeError):
                    result['topics_and_issues']['main_topics'][topic] += 1

            for issue, value in snapshot.common_issues.items():
                if issue not in result['topics_and_issues']['common_issues']:
                    result['topics_and_issues']['common_issues'][issue] = 0
                try:
                    result['topics_and_issues']['common_issues'][issue] += float(
                        value)
                except (ValueError, TypeError):
                    result['topics_and_issues']['common_issues'][issue] += 1

        # Заполняем данные для сравнения
        if comparison_snapshots:
            for snapshot in comparison_snapshots:
                result['comparison_data']['dates'].append(
                    snapshot.date.isoformat())
                result['comparison_data']['sentiment_scores'].append(
                    snapshot.sentiment_score)
                result['comparison_data']['satisfaction_indices'].append(
                    snapshot.satisfaction_index)
                result['comparison_data']['response_counts'].append(
                    snapshot.response_count)

        # Рассчитываем суммарную статистику
        if snapshots:
            result['summary']['avg_sentiment'] = snapshots.aggregate(
                avg=Avg('sentiment_score'))['avg'] or 0
            result['summary']['avg_satisfaction'] = snapshots.aggregate(
                avg=Avg('satisfaction_index'))['avg'] or 0
            result['summary']['total_responses'] = sum(
                s.response_count for s in snapshots)

            # Определяем направление тренда
            if len(snapshots) >= 2:
                first_half = list(snapshots)[:len(snapshots)//2]
                second_half = list(snapshots)[len(snapshots)//2:]

                first_avg = sum(s.satisfaction_index for s in first_half) / \
                    len(first_half) if first_half else 0
                second_avg = sum(s.satisfaction_index for s in second_half) / \
                    len(second_half) if second_half else 0

                if second_avg > first_avg * 1.05:
                    result['summary']['trend_direction'] = 'improving'
                elif second_avg < first_avg * 0.95:
                    result['summary']['trend_direction'] = 'declining'
                else:
                    result['summary']['trend_direction'] = 'stable'

        # Сортируем топики и проблемы по частоте
        result['topics_and_issues']['main_topics'] = dict(
            sorted(result['topics_and_issues']['main_topics'].items(),
                   key=lambda x: x[1], reverse=True)[:10]
        )
        result['topics_and_issues']['common_issues'] = dict(
            sorted(result['topics_and_issues']['common_issues'].items(),
                   key=lambda x: x[1], reverse=True)[:10]
        )

        return Response(result)


class FeedbackTrendRuleViewSet(viewsets.ModelViewSet):
    """
    API для управления правилами трендов обратной связи
    """
    queryset = FeedbackTrendRule.objects.all()
    serializer_class = FeedbackTrendRuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['rule_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @extend_schema(
        summary="Проверка всех активных правил",
        description="API для ручного запуска проверки всех активных правил",
        responses={
            200: OpenApiResponse(description="Количество созданных алертов"),
            403: OpenApiResponse(description="Доступ запрещен"),
        }
    )
    @action(detail=False, methods=['post'])
    def check_all(self, request):
        """
        Ручной запуск проверки всех активных правил
        """
        alerts_created = FeedbackAlertEngine.check_all_rules()
        return Response({
            'success': True,
            'alerts_created': alerts_created,
            'message': f"Успешно создано {alerts_created} алертов"
        })

    @extend_schema(
        summary="Проверка одного правила",
        description="API для ручного запуска проверки конкретного правила",
        responses={
            200: OpenApiResponse(description="Количество созданных алертов"),
            403: OpenApiResponse(description="Доступ запрещен"),
            404: OpenApiResponse(description="Правило не найдено"),
        }
    )
    @action(detail=True, methods=['post'])
    def check(self, request, pk=None):
        """
        Ручной запуск проверки конкретного правила
        """
        try:
            rule = self.get_object()
            alerts = FeedbackAlertEngine.check_rule(rule)
            return Response({
                'success': True,
                'alerts_created': len(alerts),
                'message': f"Успешно создано {len(alerts)} алертов"
            })
        except FeedbackTrendRule.DoesNotExist:
            return Response({
                'success': False,
                'message': "Правило не найдено"
            }, status=status.HTTP_404_NOT_FOUND)


class FeedbackTrendAlertViewSet(viewsets.ModelViewSet):
    """
    API для управления алертами трендов обратной связи
    """
    queryset = FeedbackTrendAlert.objects.all()
    serializer_class = FeedbackTrendAlertSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['rule__rule_type', 'severity',
                        'is_resolved', 'template', 'department']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'severity']
    ordering = ['-created_at']

    @extend_schema(
        summary="Отметка алерта как разрешенного",
        description="API для отметки алерта как разрешенного",
        request=FeedbackTrendAlertResolveSerializer,
        responses={
            200: OpenApiResponse(description="Алерт успешно отмечен как разрешенный"),
            400: OpenApiResponse(description="Ошибка в данных запроса"),
            403: OpenApiResponse(description="Доступ запрещен"),
            404: OpenApiResponse(description="Алерт не найден"),
        }
    )
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Отметка алерта как разрешенного
        """
        alert = self.get_object()
        serializer = FeedbackTrendAlertResolveSerializer(data=request.data)

        if serializer.is_valid():
            comment = serializer.validated_data.get('comment', '')
            alert.resolve(request.user, comment)
            return Response({
                'success': True,
                'message': "Алерт успешно отмечен как разрешенный"
            })
        else:
            return Response({
                'success': False,
                'message': "Ошибка в данных запроса",
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
