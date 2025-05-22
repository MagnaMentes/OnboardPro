"""
API эндпоинты для AI-ассистента Solomia
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import UserStepProgress, AIHint
from .services.solomia_service import SolomiaService


@extend_schema(
    description="Получить или сгенерировать AI-подсказку для шага онбординга",
    parameters=[
        OpenApiParameter(
            name="id", description="ID шага пользователя", required=True, type=int)
    ],
    responses={
        200: {"description": "Возвращает существующую подсказку (GET)"},
        201: {"description": "Возвращает сгенерированную подсказку (POST)"},
        404: {"description": "Подсказка не найдена или шаг не существует"}
    }
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def ai_hint(request: Request, id: int) -> Response:
    """
    GET: Получить существующую AI-подсказку для шага онбординга
    POST: Сгенерировать новую AI-подсказку
    """
    try:
        # Проверяем, что шаг существует и принадлежит текущему пользователю
        step = UserStepProgress.objects.get(id=id, user=request.user)

        if request.method == 'GET':
            # Получаем последнюю подсказку
            hint = AIHint.objects.filter(
                assignment_step=step).order_by('-created_at').first()

            if hint:
                return Response({"hint": hint.generated_hint}, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Подсказка не найдена"}, status=status.HTTP_404_NOT_FOUND)

        elif request.method == 'POST':
            # Генерируем новую подсказку
            generated_hint = SolomiaService.generate_hint_for_step(id)

            return Response({"hint": generated_hint}, status=status.HTTP_201_CREATED)

    except UserStepProgress.DoesNotExist:
        return Response({"detail": "Шаг не найден"}, status=status.HTTP_404_NOT_FOUND)
