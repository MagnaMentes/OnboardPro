from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views.hr_dashboard import (
    HRDashboardOverviewView,
    DepartmentMetricsView,
    HRAlertViewSet,
    HRAlertRuleViewSet,
    HRMetricSnapshotViewSet
)

# Создаем router для ViewSet'ов
router = DefaultRouter()
router.register(r'alerts', HRAlertViewSet)
router.register(r'alert-rules', HRAlertRuleViewSet)
router.register(r'metrics', HRMetricSnapshotViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('overview/', HRDashboardOverviewView.as_view(),
         name='hr-dashboard-overview'),
    path('departments/', DepartmentMetricsView.as_view(),
         name='department-metrics'),
]
