from django.urls import path
from .admin_views import AdminInsightsListView

urlpatterns = [
    path('insights/', AdminInsightsListView.as_view(), name='admin-insights-list'),
]
