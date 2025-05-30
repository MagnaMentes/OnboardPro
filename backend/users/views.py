from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status
import logging
from .serializers import UserSerializer, CustomTokenObtainPairSerializer

User = get_user_model()
logger = logging.getLogger('django.request')


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Кастомное представление для получения токенов JWT
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        logger.debug(f"Login attempt with data: {request.data}")
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveAPIView):
    """
    Представление для получения данных текущего пользователя
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        # Добавляем логирование
        logger.debug(
            f"Getting current user info for user_id: {self.request.user.id}")
        try:
            return self.request.user
        except Exception as e:
            logger.error(f"Error getting current user: {str(e)}")
            raise
