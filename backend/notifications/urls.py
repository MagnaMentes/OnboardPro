from django.urls import path
from .views import (
    NotificationListView, 
    NotificationDetailView, 
    mark_notification_as_read, 
    mark_all_as_read, 
    notification_settings
)

urlpatterns = [
    # API эндпойнты - префикс /api/ добавляется в config/urls.py
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/', NotificationDetailView.as_view(), name='notification-detail'),
    path('notifications/<int:pk>/read/', mark_notification_as_read, name='notification-read'),
    path('notifications/read-all/', mark_all_as_read, name='notification-read-all'),
    path('notifications/settings/', notification_settings, name='notification-settings'),
]
