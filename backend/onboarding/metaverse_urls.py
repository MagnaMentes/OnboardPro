from django.urls import path
from .metaverse_views import (
    VirtualMeetingSlotListCreateView,
    VirtualMeetingSlotDetailView
)

urlpatterns = [
    path('slots/', VirtualMeetingSlotListCreateView.as_view(),
         name='virtual-meeting-slots-list'),
    path('slots/<int:pk>/', VirtualMeetingSlotDetailView.as_view(),
         name='virtual-meeting-slots-detail'),
]
