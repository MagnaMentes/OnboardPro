from django.urls import path, re_path
from .client_views import ClientAIInsightListView, dismiss_insight, generate_insight_for_step
from .client_mock import mock_insight_for_step
# Импортируем mock_dismiss_insight из client_mock вместо client_mock_dismiss
from .client_mock import mock_dismiss_insight

urlpatterns = [
    path('assistant/insights/', ClientAIInsightListView.as_view(),
         name='client-ai-insights'),

    # Моковая версия API для скрытия подсказки - используем mock вместо реального обработчика
    path('assistant/insights/<int:insight_id>/dismiss/',
         mock_dismiss_insight, name='mock-dismiss-client-ai-insight'),

    # Моковая версия API для генерации инсайтов
    path('assistant/step/<int:step_id>/insight/',
         mock_insight_for_step, name='mock-client-ai-insight'),
]
