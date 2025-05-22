from django.urls import path, include
from .views import (
    OnboardingProgramListView, OnboardingProgramDetailView,
    AssignProgramView, UserAssignmentsView,
    CompleteStepView, AssignmentProgressView,
    OnboardingStepListCreateView
)
from .feedback_views import (
    FeedbackMoodCreateView, StepFeedbackCreateView,
    AssignmentFeedbackView
)

urlpatterns = [
    # Программы онбординга
    path('onboarding/programs/', OnboardingProgramListView.as_view(),
         name='onboarding-programs'),
    path('onboarding/programs/<int:pk>/',
         OnboardingProgramDetailView.as_view(), name='onboarding-program-detail'),
    path('onboarding/programs/<int:pk>/assign/',
         AssignProgramView.as_view(), name='onboarding-program-assign'),

    # Шаги онбординга
    path('onboarding/programs/<int:program_id>/steps/',
         OnboardingStepListCreateView.as_view(), name='onboarding-program-steps'),

    # Назначения и прогресс
    path('onboarding/assignments/my/', UserAssignmentsView.as_view(),
         name='onboarding-my-assignments'),
    path('onboarding/steps/<int:pk>/complete/',
         CompleteStepView.as_view(), name='onboarding-step-complete'),
    path('onboarding/assignments/<int:pk>/progress/',
         AssignmentProgressView.as_view(), name='onboarding-assignment-progress'),

    # Система обратной связи
    path('feedback/mood/', FeedbackMoodCreateView.as_view(),
         name='feedback-mood-create'),
    path('feedback/step/', StepFeedbackCreateView.as_view(),
         name='feedback-step-create'),
    path('feedback/assignment/<int:pk>/', AssignmentFeedbackView.as_view(),
         name='assignment-feedback'),

    # LMS URLs
    path('', include('onboarding.lms_urls')),

    # Analytics URLs
    path('analytics/', include('onboarding.analytics_urls')),

    # AI Copilot (Solomia) URLs
    path('ai/', include('onboarding.ai_urls')),
]
