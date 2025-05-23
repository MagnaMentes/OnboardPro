from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .client_models import ClientAIInsight
from .client_serializers import ClientAIInsightSerializer
from .client_services import ClientAISuggestionService


class ClientAIInsightListView(generics.ListAPIView):
    """
    Представление для получения списка активных подсказок для текущего пользователя
    """
    serializer_class = ClientAIInsightSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Возвращает подсказки только для текущего пользователя
        """
        return ClientAIInsight.objects.filter(
            user=self.request.user,
            dismissed=False
        )


@extend_schema(
    description="Отмечает подсказку как скрытую",
    responses={
        200: OpenApiResponse(description="Подсказка успешно скрыта"),
        404: OpenApiResponse(description="Подсказка не найдена")
    },
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_insight(request, pk):
    """
    Отмечает подсказку как скрытую
    """
    # Проверяем, что подсказка принадлежит текущему пользователю
    try:
        insight = ClientAIInsight.objects.get(id=pk, user=request.user)
    except ClientAIInsight.DoesNotExist:
        return Response(
            {"error": "Подсказка не найдена или вы не имеете права доступа к ней"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Отмечаем подсказку как скрытую
    success = ClientAISuggestionService.dismiss_suggestion(pk)

    if success:
        return Response(
            {"message": "Подсказка успешно скрыта"},
            status=status.HTTP_200_OK
        )
    else:
        return Response(
            {"error": "Не удалось скрыть подсказку"},
            status=status.HTTP_400_BAD_REQUEST
        )


@extend_schema(
    description="Генерирует подсказку для шага онбординга",
    responses={
        200: ClientAIInsightSerializer,
        201: ClientAIInsightSerializer,
        404: OpenApiResponse(description="Шаг не найден или нет активного назначения")
    },
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_insight_for_step(request, step_id):
    """
    Генерирует подсказку для шага онбординга.
    Если подсказка уже существует, возвращает ее.
    """
    insight = ClientAISuggestionService.generate_suggestion(
        user_id=request.user.id,
        step_id=step_id
    )

    if not insight:
        return Response(
            {"error": "Не удалось создать подсказку. Шаг не найден или у вас нет активного назначения"},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = ClientAIInsightSerializer(insight)
    status_code = status.HTTP_200_OK

    # Если подсказка была только что создана, возвращаем 201
    if insight.generated_at.replace(microsecond=0) >= timezone.now().replace(microsecond=0):
        status_code = status.HTTP_201_CREATED

    return Response(serializer.data, status=status_code)
