"""
API эндпоинты для AI-чата Solomia
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample

from .models import UserStepProgress
from .solomia_models import AIChatMessage
from .services.solomia_chat_service import SolomiaChatService


@extend_schema(
    description="Получить историю чата или отправить новое сообщение в чат с AI-ассистентом для шага онбординга",
    parameters=[
        OpenApiParameter(
            name="step_id", description="ID шага пользователя", required=True, type=int)
    ],
    responses={
        200: {"description": "Возвращает историю сообщений чата (GET) или подтверждение сохранения сообщения (POST)"},
        404: {"description": "Шаг не существует или не принадлежит пользователю"}
    },
    examples=[
        OpenApiExample(
            name="История чата",
            value={
                "messages": [
                    {
                        "id": 1,
                        "role": "human",
                        "message": "Привет, как мне выполнить этот шаг?",
                        "created_at": "2025-05-20T14:30:00Z"
                    },
                    {
                        "id": 2,
                        "role": "assistant",
                        "message": "Привет! Для выполнения этого шага рекомендую...",
                        "created_at": "2025-05-20T14:30:05Z"
                    }
                ]
            },
            response_only=True,
            status_codes=["200"]
        )
    ]
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def solomia_chat(request: Request, step_id: int) -> Response:
    """
    GET: Получить историю чата для шага онбординга
    POST: Отправить новое сообщение в чат
    """
    try:
        # Проверяем, что шаг существует и принадлежит текущему пользователю
        step = UserStepProgress.objects.get(id=step_id, user=request.user)

        if request.method == 'GET':
            # Получаем историю чата
            chat_history = SolomiaChatService.get_chat_history(
                request.user.id, step_id)
            return Response({"messages": chat_history}, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            # Получаем сообщение из запроса
            message = request.data.get('message', '').strip()

            if not message:
                return Response(
                    {"detail": "Сообщение не может быть пустым"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Генерируем ответ
            reply = SolomiaChatService.generate_reply(
                request.user.id, step_id, message)

            # Возвращаем последние два сообщения (запрос пользователя и ответ AI)
            chat_history = SolomiaChatService.get_chat_history(
                request.user.id, step_id, limit=2)
            return Response({"messages": chat_history}, status=status.HTTP_201_CREATED)

    except UserStepProgress.DoesNotExist:
        return Response({"detail": "Шаг не найден"}, status=status.HTTP_404_NOT_FOUND)
