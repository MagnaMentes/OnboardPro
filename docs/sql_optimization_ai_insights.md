# Оптимизация SQL-запросов Smart Insights Hub

## Обзор проблемы

При работе с большим объемом данных в Smart Insights Hub возникают проблемы производительности, особенно при использовании фильтрации, поиска и получения статистики. Основная проблема связана с неоптимизированными запросами Django ORM, которые могут генерировать сложные SQL-запросы с множеством JOIN-операций.

## Направления оптимизации

### 1. Индексирование полей в базе данных

Добавление индексов к часто используемым полям для поиска и фильтрации:

```python
class AIInsight(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="ai_insights", db_index=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True, related_name="ai_insights", db_index=True)
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPE_CHOICES, db_index=True)
    level = models.CharField(max_length=50, choices=INSIGHT_LEVEL_CHOICES, db_index=True)
    status = models.CharField(max_length=50, choices=INSIGHT_STATUS_CHOICES, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['department', 'level']),
            models.Index(fields=['insight_type', 'level', 'status']),
            models.Index(fields=['created_at', 'status']),
        ]
```

### 2. Оптимизация запросов с использованием `select_related` и `prefetch_related`

Преждевременная загрузка связанных объектов для снижения количества запросов:

```python
def get_queryset(self):
    queryset = SmartInsight.objects.select_related('user', 'department', 'step', 'assignment').prefetch_related('tags').all()
    return self.apply_filters(queryset)
```

Для конкретного запроса, который требует больше связанных данных:

```python
def get_object(self):
    queryset = self.filter_queryset(self.get_queryset())
    insight = get_object_or_404(queryset, pk=self.kwargs['pk'])

    # Дополнительно загружаем связанные рекомендации оптимальным способом
    insight.related_recommendations = list(AIRecommendationV2.objects.filter(
        insight=insight
    ).select_related('user').only('id', 'title', 'status', 'priority', 'recommendation_type'))

    self.check_object_permissions(self.request, insight)
    return insight
```

### 3. Использование агрегации на стороне базы данных

Перенос расчётов статистики на сторону базы данных:

```python
from django.db.models import Count, Case, When, IntegerField

def get_insights_stats(user=None, department=None):
    queryset = SmartInsight.objects.all()

    if user:
        queryset = queryset.filter(user=user)

    if department:
        queryset = queryset.filter(department=department)

    stats = queryset.aggregate(
        total=Count('id'),
        critical_count=Count(Case(When(level='critical', then=1), output_field=IntegerField())),
        high_count=Count(Case(When(level='high', then=1), output_field=IntegerField())),
        medium_count=Count(Case(When(level='medium', then=1), output_field=IntegerField())),
        low_count=Count(Case(When(level='low', then=1), output_field=IntegerField())),
        informational_count=Count(Case(When(level='informational', then=1), output_field=IntegerField())),
    )

    # Преобразование в требуемый формат
    return {
        'total': stats['total'],
        'by_level': {
            'critical': stats['critical_count'],
            'high': stats['high_count'],
            'medium': stats['medium_count'],
            'low': stats['low_count'],
            'informational': stats['informational_count'],
        }
    }
```

### 4. Пагинация и ограничение выборки

Использование пагинации и ограничение количества возвращаемых объектов:

```python
class SmartInsightViewSet(viewsets.ModelViewSet):
    serializer_class = SmartInsightSerializer
    pagination_class = PageNumberPagination
    page_size = 20
    max_page_size = 100
```

### 5. Кэширование результатов запросов

Использование Django cache для часто запрашиваемых данных:

```python
from django.core.cache import cache

@action(detail=False, methods=['get'])
def stats(self, request):
    cache_key = f'insight_stats_{request.user.id}'
    cached_stats = cache.get(cache_key)

    if cached_stats:
        return Response(cached_stats)

    # Если кэш пуст, выполняем расчет
    stats = self.calculate_stats()

    # Сохраняем в кэш на 1 час
    cache.set(cache_key, stats, 60 * 60)

    return Response(stats)
```

### 6. Оптимизация фильтров

Реализация фильтров с использованием `django-filter` и оптимизация сложных фильтров:

```python
import django_filters

class InsightFilter(django_filters.FilterSet):
    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")
    tag_slug = django_filters.CharFilter(method="filter_by_tag_slug")

    class Meta:
        model = SmartInsight
        fields = ["insight_type", "level", "status", "department", "user"]

    def filter_by_tag_slug(self, queryset, name, value):
        # Оптимизированный фильтр по slug тега
        tag_slugs = value.split(",")
        return queryset.filter(tags__slug__in=tag_slugs).distinct()
```

### 7. Использование Raw SQL для сложных запросов

В случае особо сложных или специфических запросов можно использовать raw SQL:

```python
from django.db import connection

def get_complex_aggregated_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                d.name,
                COUNT(DISTINCT ai.id) as insight_count,
                COUNT(DISTINCT CASE WHEN ai.level = 'critical' THEN ai.id ELSE NULL END) as critical_count,
                COUNT(DISTINCT CASE WHEN ai.status = 'resolved' THEN ai.id ELSE NULL END) as resolved_count
            FROM ai_insights_aiinsight ai
            LEFT JOIN departments_department d ON ai.department_id = d.id
            GROUP BY d.id
            ORDER BY insight_count DESC
        """)
        result = dictfetchall(cursor)
    return result

def dictfetchall(cursor):
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]
```

## Измерение производительности

### 1. Django Debug Toolbar

Для локальной разработки установить Django Debug Toolbar для анализа запросов:

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'debug_toolbar',
]

MIDDLEWARE = [
    # ...
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

INTERNAL_IPS = [
    '127.0.0.1',
]
```

### 2. Логирование медленных запросов

Настройка логирования SQL-запросов для выявления "узких мест":

```python
# settings.py
LOGGING = {
    # ...
    'handlers': {
        'sql_file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'sql_debug.log',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['sql_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

### 3. Профилирование с использованием Django Silk

Установка и настройка Django Silk для профилирования API-эндпоинтов:

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'silk',
]

MIDDLEWARE = [
    # ...
    'silk.middleware.SilkyMiddleware',
]

# Конфигурация Silk
SILKY_PYTHON_PROFILER = True
SILKY_AUTHENTICATION = True  # для защиты в production
SILKY_AUTHORISATION = True
SILKY_META = True
```

## Планирование и реализация изменений

1. **Анализ и профилирование**:

   - Определить наиболее медленные запросы с использованием инструментов профилирования
   - Проанализировать EXPLAIN планы запросов в PostgreSQL

2. **Индексирование**:

   - Добавить индексы на основе результатов анализа
   - Создать миграцию для добавления индексов

3. **Оптимизация запросов**:

   - Реализовать select_related и prefetch_related во всех критически важных запросах
   - Перенести агрегацию на сторону базы данных

4. **Кэширование**:

   - Настроить кэширование для статистики и часто запрашиваемых данных
   - Использовать низкоуровневое кэширование для сложных операций

5. **Мониторинг**:
   - Добавить логирование и мониторинг производительности
   - Установить алерты на медленные запросы
