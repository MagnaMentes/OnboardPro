from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .feedback_models import FeedbackMood, StepFeedback
from .feedback_serializers import (
    FeedbackMoodSerializer, StepFeedbackSerializer,
    AssignmentFeedbackSerializer
)
from .models import UserOnboardingAssignment, OnboardingStep
from users.permissions import IsAdminOrHR
from .permissions import IsAssignedUserOrHRorAdmin


class FeedbackMoodCreateView(generics.CreateAPIView):
    """
    Представление для создания записи о настроении (FeedbackMood)
    Доступно всем авторизованным пользователям
    """
    serializer_class = FeedbackMoodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Устанавливаем текущего пользователя
        serializer.save(user=self.request.user)


class StepFeedbackCreateView(generics.CreateAPIView):
    """
    Представление для создания отзыва о шаге (StepFeedback)
    Доступно всем авторизованным пользователям
    """
    serializer_class = StepFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Устанавливаем текущего пользователя
        serializer.save(user=self.request.user)


class AssignmentFeedbackView(generics.GenericAPIView):
    """
    Представление для получения всей обратной связи по конкретному назначению
    Доступно только для HR и ADMIN
    """
    serializer_class = AssignmentFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def get(self, request, pk):
        # Проверяем существование назначения
        assignment = get_object_or_404(UserOnboardingAssignment, pk=pk)

        # Собираем данные для сериализатора
        data = {
            'assignment_id': pk,
            'program_name': assignment.program.name,
            'user_email': assignment.user.email
        }

        serializer = self.get_serializer(data)
        return Response(serializer.data)
