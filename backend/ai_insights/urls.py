from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIInsightViewSet, AIRecommendationViewSet

# Создаем роутер для API
router = DefaultRouter()
router.register(r'insights', AIInsightViewSet)
router.register(r'recommendations', AIRecommendationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # URL маршруты для клиентского ассистента
    path('', include('ai_insights.client_urls')),
    # URL маршруты для AI-инсайтов по обучению
    path('', include('ai_insights.training_urls')),
]
