from django.urls import path
from . import admin_views

urlpatterns = [
    # URL для админской панели Smart Scheduler
    path('user/<int:user_id>/', admin_views.SchedulerUserAdminView.as_view(),
         name='scheduler-user-admin'),
    path('conflicts/', admin_views.SchedulerConflictsAdminView.as_view(),
         name='scheduler-conflicts-admin'),
    path('summary/', admin_views.SchedulerSummaryAdminView.as_view(),
         name='scheduler-summary-admin'),
]
