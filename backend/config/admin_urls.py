from django.urls import path, include

urlpatterns = [
    # URL маршруты для административной панели пользователей
    path('users/', include('users.admin_urls')),

    # URL маршруты для административной панели департаментов
    path('departments/', include('departments.admin_urls')),

    # URL маршруты для административной панели онбординга
    path('onboarding/', include('onboarding.admin_urls')),

    # URL маршруты для административной панели AI-инсайтов
    path('ai/', include('ai_insights.admin_urls')),
]
