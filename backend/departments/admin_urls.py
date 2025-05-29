from django.urls import path
from .admin_views import DepartmentOverviewView

urlpatterns = [
    path('overview/', DepartmentOverviewView.as_view(),
         name='admin-departments-overview'),
]
