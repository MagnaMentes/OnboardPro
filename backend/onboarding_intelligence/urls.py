from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    IntelligenceDashboardViewSet,
    UserIntelligenceDashboardViewSet,
    DepartmentIntelligenceDashboardViewSet,
    AlertsViewSet,
    AnomalyViewSet,
    RiskPredictionViewSet
)

router = DefaultRouter()
router.register(r'anomalies', AnomalyViewSet)
router.register(r'risks', RiskPredictionViewSet)

urlpatterns = [
    path('dashboard/overview/', IntelligenceDashboardViewSet.as_view(
        {'get': 'list'}), name='intelligence-dashboard-overview'),
    path('dashboard/user/<int:user_id>/', UserIntelligenceDashboardViewSet.as_view(
        {'get': 'retrieve'}), name='intelligence-dashboard-user'),
    path('dashboard/department/<int:department_id>/', DepartmentIntelligenceDashboardViewSet.as_view(
        {'get': 'retrieve'}), name='intelligence-dashboard-department'),
    path('dashboard/alerts/',
         AlertsViewSet.as_view({'get': 'list'}), name='intelligence-dashboard-alerts'),
    path('', include(router.urls)),
]
