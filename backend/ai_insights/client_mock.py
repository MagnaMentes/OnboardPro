from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mock_insight_for_step(request, step_id):
    """
    Возвращает моковую подсказку для шага онбординга
    """
    # Создаем моковые данные
    mock_data = {
        "id": 999,
        "user": request.user.id,
        "assignment": 1,
        "step": int(step_id),
        "step_name": f"Шаг {step_id}",
        "program_name": "Программа онбординга",
        "hint_text": f"Это моковая подсказка для шага {step_id}. В реальной версии здесь будет настоящая рекомендация AI-ассистента.",
        "generated_at": timezone.now().isoformat(),
        "dismissed": False
    }

    return Response(mock_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mock_dismiss_insight(request, insight_id):
    """
    Имитирует скрытие подсказки
    """
    # В реальном приложении здесь бы обновлялась запись в БД
    # но для мока просто возвращаем успешный ответ

    return Response(
        {"message": f"Подсказка {insight_id} успешно скрыта"},
        status=status.HTTP_200_OK
    )
