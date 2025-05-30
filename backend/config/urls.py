"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # AI Assistant endpoints (placed before general API includes)
    path('api/ai/', include('ai_insights.urls')),
    path('apiai/', include('ai_insights.urls')),

    # API URLs
    path('api/', include('core.urls')),
    path('api/', include('users.urls')),
    path('api/', include('departments.urls')),
    path('api/', include('onboarding.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('gamification.urls')),
    path('api/', include('solomia.urls')),
    path('api/feedback/', include('feedback.urls')),
    path('api/scheduler/', include('scheduler.urls')),

    # Admin Dashboard API
    path('api/admin/', include('config.admin_urls')),
    path('api/admin/scheduler/', include('scheduler.admin_urls')),

    # Swagger/OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'),
         name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
