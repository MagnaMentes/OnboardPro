from django.urls import path
from .admin_views import AdminUserListView, UserAnalyticsView

urlpatterns = [
    path('', AdminUserListView.as_view(), name='admin-users-list'),
    path('<int:pk>/analytics/',
         UserAnalyticsView.as_view(), name='user-analytics'),
]
