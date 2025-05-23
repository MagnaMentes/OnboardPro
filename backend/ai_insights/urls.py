from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIInsightViewSet

# Создаем роутер для API
router = DefaultRouter()
router.register(r'insights', AIInsightViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # URL маршруты для клиентского ассистента
    path('', include('ai_insights.client_urls')),
]
