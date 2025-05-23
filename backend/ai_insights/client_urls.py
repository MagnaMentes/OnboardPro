from django.urls import path
from .client_views import ClientAIInsightListView, dismiss_insight, generate_insight_for_step

urlpatterns = [
    path('assistant/insights/', ClientAIInsightListView.as_view(),
         name='client-ai-insights'),
    path('assistant/insights/<int:pk>/dismiss/',
         dismiss_insight, name='dismiss-client-ai-insight'),
    path('assistant/step/<int:step_id>/insight/',
         generate_insight_for_step, name='generate-client-ai-insight'),
]
