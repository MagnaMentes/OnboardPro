"""
URL маршруты для API AI-чата Solomia
"""
from django.urls import path
from .chat_views import solomia_chat

urlpatterns = [
    path('<int:step_id>/', solomia_chat, name='solomia_chat'),
]
