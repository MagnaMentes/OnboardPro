from django.urls import path
from .calendar_views import MeetingCalendarExportView

urlpatterns = [
    path('calendar/ical/', MeetingCalendarExportView.as_view(),
         name='meetings-calendar-export'),
]
