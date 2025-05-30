from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Создаем роутер для ViewSets
router = DefaultRouter()
router.register(r'scheduled-steps', views.ScheduledStepViewSet,
                basename='scheduled-steps')
router.register(r'constraints', views.ScheduleConstraintViewSet,
                basename='constraints')
router.register(r'availability', views.UserAvailabilityViewSet,
                basename='availability')
router.register(r'mentor-loads', views.MentorLoadViewSet,
                basename='mentor-loads')
router.register(r'events', views.CalendarEventViewSet, basename='events')

# Создаем и экспортируем urlpatterns
urlpatterns = [
    # Включаем API маршруты из роутера
    path('', include(router.urls)),

    # API эндпоинты для умного планировщика
    path('plan/', views.SchedulerPlanAPIView.as_view(), name='scheduler-plan'),
    path('user/<str:user_id>/', views.SchedulerUserAPIView.as_view(),
         name='scheduler-user'),
    path('override/', views.SchedulerOverrideAPIView.as_view(),
         name='scheduler-override'),
    path('conflicts/', views.SchedulerConflictsAPIView.as_view(),
         name='scheduler-conflicts'),

    # API эндпоинты для AI-интеграции
    path('ai/prioritization/', views.SmartPrioritizationAPIView.as_view(),
         name='ai-prioritization'),
    path('ai/predict-delays/<int:assignment_id>/',
         views.PredictDelaysAPIView.as_view(),
         name='predict-delays'),
]
