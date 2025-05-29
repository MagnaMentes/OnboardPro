from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


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
