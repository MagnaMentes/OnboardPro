"""
URL маршруты для AI-ассистента Solomia
"""
from django.urls import path

from . import ai_views

app_name = 'ai'

urlpatterns = [
    # AI-подсказки
    path('step/<int:id>/hint/', ai_views.ai_hint, name='ai_hint'),
]
