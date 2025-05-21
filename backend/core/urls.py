from django.urls import path
from .api import HealthCheckView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
]
