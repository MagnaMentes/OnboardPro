from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from onboarding.models import UserStepProgress
from .models import AIChatMessage
from .serializers import AIChatMessageSerializer, ChatRequestSerializer, ChatHistoryResponseSerializer


class SolomiaStepChatView(views.APIView):
    """
    API View для работы с чатом Solomia в контексте шага онбординга
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, step_id):
        """
        Получение истории чата для конкретного шага
        """
        # Проверка существования шага
        step_progress = get_object_or_404(
            UserStepProgress,
            id=step_id,
            user=request.user
        )

        # Получение сообщений
        messages = AIChatMessage.objects.filter(
            user=request.user,
            step_progress=step_progress
        ).order_by('created_at')

        # Сериализация и возврат ответа
        serializer = AIChatMessageSerializer(messages, many=True)
        return Response({"messages": serializer.data})

    def post(self, request, step_id):
        """
        Отправка сообщения и получение ответа от Solomia
        """
        # Проверка существования шага
        step_progress = get_object_or_404(
            UserStepProgress,
            id=step_id,
            user=request.user
        )

        # Валидация запроса
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Получение сообщения
        user_message = serializer.validated_data['message']

        # Сохранение сообщения пользователя
        user_message_obj = AIChatMessage.objects.create(
            user=request.user,
            step_progress=step_progress,
            role='human',
            message=user_message
        )

        # Заглушка для ответа Solomia (в реальном приложении здесь будет вызов AI-сервиса)
        ai_reply = f"Это временный ответ от Solomia на ваше сообщение: '{user_message}'. " \
            f"AI-интеграция находится в процессе разработки."

        # Сохранение ответа AI
        ai_message_obj = AIChatMessage.objects.create(
            user=request.user,
            step_progress=step_progress,
            role='assistant',
            message=ai_reply
        )

        # Возврат последних двух сообщений
        latest_messages = [user_message_obj, ai_message_obj]
        serializer = AIChatMessageSerializer(latest_messages, many=True)
        return Response({"messages": serializer.data})
