from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .lms_v2_views import (
    LMSEditorViewSet, EnhancedLMSQuestionViewSet, OpenAnswerOptionViewSet,
    EnhancedTestSettingsViewSet, LearningModuleListView, LessonDetailView,
    LessonProgressUpdateView, EnhancedTestDetailView, StartTestAttemptView,
    SubmitEnhancedTestView
)

# Создаем роутер для API редактора LMS
editor_router = DefaultRouter()
editor_router.register(r'learning-modules',
                       LMSEditorViewSet, basename='learning-module')
editor_router.register(r'lessons', LMSEditorViewSet, basename='lesson')
editor_router.register(r'attachments', LMSEditorViewSet, basename='attachment')
editor_router.register(r'enhanced-questions',
                       EnhancedLMSQuestionViewSet, basename='enhanced-question')
editor_router.register(r'open-answer-options',
                       OpenAnswerOptionViewSet, basename='open-answer-option')
editor_router.register(
    r'enhanced-settings', EnhancedTestSettingsViewSet, basename='enhanced-settings')

# URL-паттерны для LMS v2
urlpatterns = [
    # Маршруты для редактора LMS (только для HR и Admin)
    path('admin/lms/editor/', include(editor_router.urls)),

    # Маршруты для пользователей
    path('lms/v2/module/<int:step_id>/',
         LearningModuleListView.as_view(), name='learning-module-list'),
    path('lms/v2/lesson/<int:pk>/',
         LessonDetailView.as_view(), name='lesson-detail'),
    path('lms/v2/lesson/<int:lesson_id>/progress/',
         LessonProgressUpdateView.as_view(), name='lesson-progress-update'),
    path('lms/v2/test/<int:step_id>/',
         EnhancedTestDetailView.as_view(), name='enhanced-test-detail'),
    path('lms/v2/test/start/', StartTestAttemptView.as_view(),
         name='start-test-attempt'),
    path('lms/v2/test/submit/', SubmitEnhancedTestView.as_view(),
         name='submit-enhanced-test'),
]
