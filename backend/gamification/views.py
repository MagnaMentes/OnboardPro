from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import UserLevel, UserReward
from .serializers import (
    UserLevelSerializer,
    UserRewardSerializer,
    GamificationEventSerializer
)
from .services import GamificationService


class GamificationProfileView(generics.RetrieveAPIView):
    """
    Представление для получения профиля геймификации текущего пользователя
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserLevelSerializer

    def get_object(self):
        return UserLevel.objects.get_or_create(
            user=self.request.user,
            defaults={"level": 1, "points": 0}
        )[0]


class GamificationAchievementsView(generics.ListAPIView):
    """
    Представление для получения списка достижений пользователя
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserRewardSerializer

    def get_queryset(self):
        return UserReward.objects.filter(user=self.request.user)


class TrackEventView(generics.CreateAPIView):
    """
    Представление для отправки событий геймификации
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = GamificationEventSerializer

    def perform_create(self, serializer):
        # Обработка события через GamificationService
        event_type = serializer.validated_data["event_type"]
        GamificationService.handle_event(self.request.user, event_type)
        return Response({"status": "success"}, status=status.HTTP_200_OK)
