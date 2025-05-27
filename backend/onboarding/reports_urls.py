from django.urls import path
from .reports_views import ReportAssignmentPDFView, ReportAssignmentCSVView

urlpatterns = [
    path('assignments/pdf/', ReportAssignmentPDFView.as_view(),
         name='assignment-report-pdf'),
    path('assignments/csv/', ReportAssignmentCSVView.as_view(),
         name='assignment-report-csv'),
]
