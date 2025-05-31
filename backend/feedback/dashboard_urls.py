"""
URL маршруты для Smart Feedback Dashboard
"""
from rest_framework.routers import DefaultRouter
from .views.dashboard_views import (
    FeedbackTrendSnapshotViewSet, FeedbackTrendRuleViewSet,
    FeedbackTrendAlertViewSet
)

router = DefaultRouter()
router.register(r'trend-snapshots', FeedbackTrendSnapshotViewSet)
router.register(r'trend-rules', FeedbackTrendRuleViewSet)
router.register(r'trend-alerts', FeedbackTrendAlertViewSet)

urlpatterns = router.urls
