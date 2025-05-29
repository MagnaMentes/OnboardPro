from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeedbackTemplateViewSet, UserFeedbackViewSet, FeedbackInsightsViewSet
)

router = DefaultRouter()
router.register(r'templates', FeedbackTemplateViewSet,
                basename='feedback-templates')
router.register(r'feedbacks', UserFeedbackViewSet, basename='user-feedbacks')
router.register(r'insights', FeedbackInsightsViewSet,
                basename='feedback-insights')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'send/', UserFeedbackViewSet.as_view({'post': 'create'}), name='feedback-send'),
]
