from django.urls import path
from .admin_views import AdminUserListView

urlpatterns = [
    path('users/', AdminUserListView.as_view(), name='admin-users-list'),
]
