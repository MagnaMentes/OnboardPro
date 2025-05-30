"""
URLs package for core application.
"""

from django.urls import path, include

urlpatterns = [
    path('hr/dashboard/', include('core.urls.hr_dashboard')),
]
