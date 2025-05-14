from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal
from datetime import datetime

# Схемы для данных аналитики


class TaskDetail(BaseModel):
    """Детальная информация о задаче для WebSocket-сообщений"""
    id: int
    title: str
    priority: str = "medium"
    status: str
    created_at: Optional[str] = None
    deadline: Optional[str] = None
    assignee_name: Optional[str] = "Не назначено"
    assignee_id: Optional[int] = None
    department: Optional[str] = "Не указано"
    user_id: Optional[int] = None


class PriorityStats(BaseModel):
    """Статистика задач по приоритетам"""
    total: int = 0
    completed: int = 0
    in_progress: int = 0
    pending: int = 0


class TaskStats(BaseModel):
    """Статистика задач для аналитики"""
    total: int = 0
    completed: int = 0
    in_progress: int = 0
    pending: int = 0
    completion_rate: float = 0
    priority: Dict[str, PriorityStats] = Field(default_factory=dict)
    in_progress_tasks_details: List[TaskDetail] = Field(default_factory=list)


class FeedbackStats(BaseModel):
    """Статистика обратной связи"""
    total: int = 0
    avg_per_user: float = 0


class AnalyticsMetadata(BaseModel):
    """Метаданные аналитики"""
    generated_at: str
    real_time_update: bool = True
    version: Optional[int] = None
    triggered_by_task_id: Optional[int] = None


class AnalyticsData(BaseModel):
    """Данные аналитики"""
    task_stats: TaskStats = Field(default_factory=TaskStats)
    feedback_stats: FeedbackStats = Field(default_factory=FeedbackStats)
    metadata: Optional[AnalyticsMetadata] = None


class WebSocketAnalyticsMessage(BaseModel):
    """Формат сообщения с аналитикой для WebSocket"""
    current: AnalyticsData
    previous: Optional[AnalyticsData] = None
    metadata: AnalyticsMetadata

# Схемы для сообщений об изменении статуса задачи


class TaskStatusChangeData(BaseModel):
    """Данные об изменении статуса задачи"""
    id: int
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    user_id: int
    plan_id: int
    previous_status: Optional[str] = None


class WebSocketTaskStatusMessage(BaseModel):
    """Формат сообщения об изменении статуса задачи"""
    type: Literal["task_status_changed"]
    data: TaskStatusChangeData
    timestamp: int = Field(default_factory=lambda: int(
        datetime.now().timestamp() * 1000))

# Общие типы сообщений


class WebSocketMessage(BaseModel):
    """Базовый формат для всех WebSocket сообщений"""
    type: str
    data: Any
    timestamp: int = Field(default_factory=lambda: int(
        datetime.now().timestamp() * 1000))

# Функции для валидации и создания сообщений


def create_analytics_message(
    analytics_data: Dict[str, Any],
    task_id: Optional[int] = None
) -> WebSocketAnalyticsMessage:
    """
    Создает корректно структурированное сообщение с аналитикой для WebSocket

    Args:
        analytics_data: Данные аналитики из функции get_analytics_data_for_websocket
        task_id: ID задачи, которая вызвала обновление аналитики

    Returns:
        WebSocketAnalyticsMessage: Валидированное сообщение для отправки через WebSocket
    """
    metadata = AnalyticsMetadata(
        generated_at=datetime.now().isoformat(),
        real_time_update=True,
        triggered_by_task_id=task_id
    )

    # Создаем объект с правильной структурой
    message = WebSocketAnalyticsMessage(
        current=AnalyticsData(**analytics_data),
        previous=None,
        metadata=metadata
    )

    return message
