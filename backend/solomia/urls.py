from django.urls import path
from .views import SolomiaStepChatView

urlpatterns = [
    # Чат Solomia для шага онбординга
    path("solomia/chat/<int:step_id>/", SolomiaStepChatView.as_view(),
         name="solomia-step-chat"),
]
