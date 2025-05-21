from django.urls import path
from .lms_views import (
    LMSModuleListView, LMSTestDetailView,
    LMSTestSubmitView, LMSUserTestResultView
)

urlpatterns = [
    # LMS модули
    path('lms/module/<int:step_id>/',
         LMSModuleListView.as_view(), name='lms-modules'),

    # LMS тесты
    path('lms/test/<int:step_id>/',
         LMSTestDetailView.as_view(), name='lms-test-detail'),
    path('lms/test/<int:step_id>/submit/',
         LMSTestSubmitView.as_view(), name='lms-test-submit'),
    path('lms/test/<int:step_id>/result/',
         LMSUserTestResultView.as_view(), name='lms-test-result'),
]
