from typing import Dict, Any, List, Optional
import logging
import traceback
from datetime import datetime

try:
    from schemas.websocket_schemas import (
        WebSocketAnalyticsMessage,
        create_analytics_message,
    )
except ImportError:
    # Обеспечиваем обратную совместимость даже в случае отсутствия модуля схем
    def create_analytics_message(analytics_data: Dict[str, Any], task_id: Optional[int] = None):
        """Метод-совместимость для создания сообщений аналитики без валидации"""
        return {
            "current": analytics_data,
            "previous": None,
            "metadata": {
                "triggered_by_task_id": task_id,
                "real_time_update": True,
                "generated_at": datetime.now().isoformat()
            }
        }

logger = logging.getLogger(__name__)


class AnalyticsMessageFormatter:
    """
    Класс для форматирования и валидации сообщений аналитики.
    Обеспечивает обратную совместимость при изменении формата сообщений.
    """

    @staticmethod
    def format_analytics_message(analytics_data: Dict[str, Any], task_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Форматирует данные аналитики в структуру, ожидаемую фронтендом.

        Args:
            analytics_data: Данные аналитики из функции get_analytics_data_for_websocket
            task_id: ID задачи, которая вызвала обновление аналитики

        Returns:
            Dict[str, Any]: Структурированное сообщение для отправки через WebSocket
        """
        try:
            # Пытаемся использовать модель Pydantic для валидации
            message = create_analytics_message(analytics_data, task_id)

            # Если модель Pydantic используется, преобразуем объект в словарь
            if hasattr(message, "model_dump"):
                return message.model_dump()
            return message
        except Exception as e:
            # В случае ошибки валидации формируем сообщение вручную
            logger.error(
                f"Ошибка форматирования сообщения аналитики: {str(e)}")
            logger.debug(traceback.format_exc())

            # Обеспечиваем правильную структуру данных даже при ошибке
            formatted_message = {
                "current": analytics_data,
                "previous": None,
                "metadata": {
                    "triggered_by_task_id": task_id,
                    "real_time_update": True,
                    "generated_at": datetime.now().isoformat(),
                    "error_handling": True
                }
            }

            return formatted_message

    @staticmethod
    def validate_analytics_data(analytics_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Проверяет и исправляет структуру данных аналитики.

        Args:
            analytics_data: Данные аналитики

        Returns:
            Dict[str, Any]: Данные аналитики с правильной структурой
        """
        # Проверяем наличие обязательных полей верхнего уровня
        if "task_stats" not in analytics_data:
            logger.warning(
                "Отсутствует поле task_stats в данных аналитики, создаем пустой объект")
            analytics_data["task_stats"] = {}

        if "feedback_stats" not in analytics_data:
            logger.warning(
                "Отсутствует поле feedback_stats в данных аналитики, создаем пустой объект")
            analytics_data["feedback_stats"] = {}

        # Проверяем структуру данных о задачах
        task_stats = analytics_data["task_stats"]
        if "in_progress_tasks_details" not in task_stats:
            logger.warning(
                "Отсутствует поле in_progress_tasks_details, создаем пустой массив")
            task_stats["in_progress_tasks_details"] = []

        # Обеспечиваем правильный тип данных
        if not isinstance(task_stats["in_progress_tasks_details"], list):
            logger.warning(
                f"Некорректный тип данных для in_progress_tasks_details: {type(task_stats['in_progress_tasks_details'])}, исправляем на список")
            task_stats["in_progress_tasks_details"] = []

        # Проверяем наличие обязательных полей статистики задач
        for field in ["total", "completed", "in_progress", "pending", "completion_rate"]:
            if field not in task_stats:
                logger.warning(
                    f"Отсутствует поле {field} в task_stats, устанавливаем значение по умолчанию")
                task_stats[field] = 0

        # Проверяем наличие статистики по приоритетам
        if "priority" not in task_stats:
            logger.warning(
                "Отсутствует поле priority в task_stats, создаем пустой объект")
            task_stats["priority"] = {}

        return analytics_data


def get_analytics_formatter() -> AnalyticsMessageFormatter:
    """
    Фабричный метод для получения форматтера аналитических сообщений.
    """
    return AnalyticsMessageFormatter()
