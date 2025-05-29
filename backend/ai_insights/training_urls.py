from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .training_views import (
    TrainingInsightViewSet, UserLearningMetricView, DepartmentTrainingOverviewView,
    QuestionDifficultyViewSet, DepartmentComparisonView, TrainingCommandCenter,
    RunTrainingAnalysisView
)

# Создаем роутер для API инсайтов по обучению
insights_router = DefaultRouter()
insights_router.register(
    r'insights', TrainingInsightViewSet, basename='training-insight')
insights_router.register(r'questions-difficulty',
                         QuestionDifficultyViewSet, basename='question-difficulty')

# URL-паттерны для AI-инсайтов по обучению
urlpatterns = [
    # API для работы с инсайтами
    path('admin/training/', include(insights_router.urls)),

    # Маршрут для просмотра метрик пользователя
    path('admin/training/user/<int:user_id>/',
         UserLearningMetricView.as_view(), name='user-learning-metrics'),

    # Маршрут для обзора обучения по департаменту
    path('admin/departments/<int:department_id>/training/',
         DepartmentTrainingOverviewView.as_view(), name='department-training-overview'),

    # Маршрут для сравнения департаментов
    path('admin/training/departments-comparison/',
         DepartmentComparisonView.as_view(), name='department-comparison'),

    # Маршрут для командного центра обучения
    path('admin/training/command-center/',
         TrainingCommandCenter.as_view(), name='training-command-center'),

    # Маршрут для запуска анализа данных обучения
    path('admin/training/run-analysis/',
         RunTrainingAnalysisView.as_view(), name='run-training-analysis'),
]
