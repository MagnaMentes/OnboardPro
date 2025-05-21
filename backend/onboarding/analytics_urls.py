from django.urls import path
from .analytics_views import AnalyticsSummaryView, AssignmentsAnalyticsView, FeedbackSummaryView

urlpatterns = [
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('assignments/', AssignmentsAnalyticsView.as_view(),
         name='analytics-assignments'),
    path('feedback-summary/', FeedbackSummaryView.as_view(),
         name='analytics-feedback-summary'),
]
