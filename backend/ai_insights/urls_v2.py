from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_v2 import AIInsightViewSet, AIRecommendationViewSet, InsightTagViewSet, get_insight_stats, get_recommendation_stats

router = DefaultRouter()
router.register(r'insights', AIInsightViewSet, basename='ai-insight-v2')
router.register(r'recommendations', AIRecommendationViewSet,
                basename='ai-recommendation-v2')
router.register(r'tags', InsightTagViewSet, basename='insight-tag')

urlpatterns = [
    path('', include(router.urls)),
    path('insights/stats/', get_insight_stats, name='ai-insight-stats-v2'),
    path('recommendations/stats/', get_recommendation_stats,
         name='ai-recommendation-stats-v2'),
]
