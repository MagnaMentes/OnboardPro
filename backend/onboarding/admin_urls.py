from django.urls import path
from .admin_views import AdminAssignmentsListView, AdminFeedbacksListView

urlpatterns = [
    path('assignments/', AdminAssignmentsListView.as_view(),
         name='admin-assignments-list'),
    path('feedbacks/', AdminFeedbacksListView.as_view(),
         name='admin-feedbacks-list'),
]
