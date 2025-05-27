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
            name="id", description="ID шага программы онбординга", required=True, type=int)
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
        # Находим шаг программы онбординга
        from .models import OnboardingStep
        step_obj = OnboardingStep.objects.get(id=id)

        # Получаем или создаем прогресс шага для текущего пользователя
        step_progress, created = UserStepProgress.objects.get_or_create(
            user=request.user,
            step=step_obj,
            defaults={'status': UserStepProgress.ProgressStatus.NOT_STARTED}
        )

        if request.method == 'GET':
            # Получаем последнюю подсказку
            hint = AIHint.objects.filter(
                assignment_step=step_progress).order_by('-created_at').first()

            if hint:
                # Возвращаем данные в формате, совместимом с фронтендом
                response_data = {
                    "hint_text": hint.generated_hint,
                    "id": hint.id,
                    "user": request.user.id,
                    "assignment": getattr(step_progress.assignment, 'id', None),
                    "step": step_obj.id,
                    "step_name": step_obj.name,
                    "program_name": step_obj.program.name,
                    "generated_at": hint.created_at.isoformat(),
                    "dismissed": False
                }
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response({"detail": "Подсказка не найдена"}, status=status.HTTP_404_NOT_FOUND)

        elif request.method == 'POST':
            # Генерируем новую подсказку
            generated_hint = SolomiaService.generate_hint_for_step(
                step_progress.id)

            # Создаем новую запись в базе данных
            hint = AIHint.objects.create(
                assignment_step=step_progress,
                generated_hint=generated_hint
            )

            # Возвращаем данные в формате, совместимом с фронтендом
            response_data = {
                "hint_text": generated_hint,
                "id": hint.id,
                "user": request.user.id,
                "assignment": getattr(step_progress.assignment, 'id', None),
                "step": step_obj.id,
                "step_name": step_obj.name,
                "program_name": step_obj.program.name,
                "generated_at": hint.created_at.isoformat(),
                "dismissed": False
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

    except OnboardingStep.DoesNotExist:
        return Response({"detail": "Шаг не найден"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"detail": f"Ошибка: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except UserStepProgress.DoesNotExist:
        return Response({"detail": "Шаг не найден"}, status=status.HTTP_404_NOT_FOUND)
