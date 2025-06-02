"""
URL маршруты для Smart Feedback Dashboard
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.dashboard_views import (
    FeedbackTrendSnapshotViewSet, FeedbackTrendRuleViewSet,
    FeedbackTrendAlertViewSet
)

# Инициализируем роутер без регистрации viewsets
router = DefaultRouter()

# Получаем view для dashboard-data
trend_snapshot_viewset = FeedbackTrendSnapshotViewSet.as_view({
    'get': 'dashboard_data'
})

# Формируем URL-паттерны явным образом
urlpatterns = [
    # Эндпоинт для dashboard-data
    path('trend-snapshots/dashboard-data/', trend_snapshot_viewset,
         name='trend-snapshots-dashboard-data'),

    # Остальные маршруты через DefaultRouter
    # Регистрируем viewsets после создания кастомных эндпоинтов
    # чтобы избежать конфликтов маршрутов
]

# Теперь регистрируем viewsets
router.register(r'trend-snapshots', FeedbackTrendSnapshotViewSet)
router.register(r'trend-rules', FeedbackTrendRuleViewSet)
router.register(r'trend-alerts', FeedbackTrendAlertViewSet)

# Добавляем маршруты из роутера к существующим маршрутам
urlpatterns += router.urls
