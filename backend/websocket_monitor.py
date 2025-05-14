"""
Модуль для мониторинга и управления WebSocket соединениями.
Позволяет отслеживать активные соединения, их состояние и метрики использования.
"""
from typing import Dict, List, Set, Any, Optional
from datetime import datetime, timedelta
import logging
import asyncio
import json
from fastapi import WebSocket
from starlette.websockets import WebSocketState
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ConnectionStats(BaseModel):
    """Статистика WebSocket соединения"""
    client_id: str
    user_id: Optional[int] = None
    user_role: Optional[str] = None
    connection_time: datetime
    last_activity: datetime
    messages_received: int = 0
    messages_sent: int = 0
    bytes_received: int = 0
    bytes_sent: int = 0
    last_error: Optional[str] = None
    ping_latency: Optional[float] = None  # в миллисекундах


class WebSocketMonitor:
    """
    Класс для мониторинга WebSocket соединений.
    Отслеживает активные соединения, собирает статистику и предоставляет инструменты для анализа.
    """

    def __init__(self, connection_timeout_seconds: int = 300):
        """
        Инициализация монитора WebSocket соединений.

        Args:
            connection_timeout_seconds: Время в секундах, после которого неактивное соединение считается "зависшим"
        """
        self.connections: Dict[str, WebSocket] = {}
        self.connection_stats: Dict[str, ConnectionStats] = {}
        self.connection_timeout = timedelta(seconds=connection_timeout_seconds)
        self._monitoring_task = None

    async def register_connection(self, websocket: WebSocket, client_id: str, user_id: Optional[int] = None,
                                  user_role: Optional[str] = None) -> None:
        """
        Регистрация нового WebSocket соединения для мониторинга.

        Args:
            websocket: Объект WebSocket соединения
            client_id: Уникальный идентификатор клиента
            user_id: ID пользователя (если авторизован)
            user_role: Роль пользователя (если авторизована)
        """
        self.connections[client_id] = websocket
        current_time = datetime.now()

        self.connection_stats[client_id] = ConnectionStats(
            client_id=client_id,
            user_id=user_id,
            user_role=user_role,
            connection_time=current_time,
            last_activity=current_time
        )

        logger.info(
            f"[WebSocketMonitor] Зарегистрировано соединение: {client_id}, пользователь: {user_id}, роль: {user_role}")

    def unregister_connection(self, client_id: str) -> None:
        """
        Удаление соединения из мониторинга.

        Args:
            client_id: Уникальный идентификатор клиента
        """
        if client_id in self.connections:
            del self.connections[client_id]

        if client_id in self.connection_stats:
            stats = self.connection_stats[client_id]
            duration = datetime.now() - stats.connection_time

            logger.info(
                f"[WebSocketMonitor] Удалено соединение: {client_id}, "
                f"длительность: {duration.total_seconds():.1f}с, "
                f"отправлено сообщений: {stats.messages_sent}, "
                f"получено сообщений: {stats.messages_received}"
            )

            del self.connection_stats[client_id]

    async def update_activity(self, client_id: str, received: bool = False, sent: bool = False,
                              bytes_count: int = 0, message: Optional[Any] = None) -> None:
        """
        Обновление статистики активности соединения.

        Args:
            client_id: Уникальный идентификатор клиента
            received: Флаг получения сообщения
            sent: Флаг отправки сообщения
            bytes_count: Количество байт в сообщении
            message: Содержимое сообщения (для логирования)
        """
        if client_id not in self.connection_stats:
            return

        stats = self.connection_stats[client_id]
        stats.last_activity = datetime.now()

        if received:
            stats.messages_received += 1
            stats.bytes_received += bytes_count

        if sent:
            stats.messages_sent += 1
            stats.bytes_sent += bytes_count

    async def record_error(self, client_id: str, error_message: str) -> None:
        """
        Запись информации об ошибке для соединения.

        Args:
            client_id: Уникальный идентификатор клиента
            error_message: Сообщение об ошибке
        """
        if client_id in self.connection_stats:
            self.connection_stats[client_id].last_error = error_message
            logger.error(
                f"[WebSocketMonitor] Ошибка для клиента {client_id}: {error_message}")

    async def ping_clients(self) -> None:
        """
        Отправка ping-сообщений всем активным клиентам для проверки соединения.
        Измеряет время отклика и обновляет статистику.
        """
        for client_id, websocket in list(self.connections.items()):
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    start_time = datetime.now()
                    pong_waiter = await websocket.ping()
                    await pong_waiter
                    # в миллисекундах
                    latency = (datetime.now() -
                               start_time).total_seconds() * 1000

                    if client_id in self.connection_stats:
                        self.connection_stats[client_id].ping_latency = latency

                    logger.debug(
                        f"[WebSocketMonitor] Пинг клиента {client_id}: {latency:.2f}мс")
            except Exception as e:
                await self.record_error(client_id, f"Ошибка ping: {str(e)}")

    async def check_inactive_connections(self) -> List[str]:
        """
        Проверка неактивных соединений, которые могли "зависнуть".

        Returns:
            List[str]: Список идентификаторов клиентов с неактивными соединениями
        """
        current_time = datetime.now()
        inactive_clients = []

        for client_id, stats in list(self.connection_stats.items()):
            if current_time - stats.last_activity > self.connection_timeout:
                inactive_clients.append(client_id)
                logger.warning(
                    f"[WebSocketMonitor] Обнаружено неактивное соединение: {client_id}, "
                    f"последняя активность: {stats.last_activity}, "
                    f"длительность неактивности: {(current_time - stats.last_activity).total_seconds():.1f}с"
                )

        return inactive_clients

    async def start_monitoring(self, check_interval_seconds: int = 60) -> None:
        """
        Запуск задачи мониторинга WebSocket соединений.

        Args:
            check_interval_seconds: Интервал проверки соединений в секундах
        """
        if self._monitoring_task is not None:
            return

        async def monitoring_loop():
            while True:
                try:
                    await asyncio.sleep(check_interval_seconds)

                    # Проверка активности соединений
                    inactive_clients = await self.check_inactive_connections()

                    # Отправка ping для проверки состояния соединений
                    if len(self.connections) > 0:
                        await self.ping_clients()

                    # Логирование общей статистики
                    if self.connections:
                        logger.info(
                            f"[WebSocketMonitor] Активных соединений: {len(self.connections)}, "
                            f"неактивных: {len(inactive_clients)}"
                        )

                except Exception as e:
                    logger.error(
                        f"[WebSocketMonitor] Ошибка в мониторинге: {str(e)}")

        self._monitoring_task = asyncio.create_task(monitoring_loop())
        logger.info(
            "[WebSocketMonitor] Запущен мониторинг WebSocket соединений")

    async def stop_monitoring(self) -> None:
        """Остановка задачи мониторинга WebSocket соединений."""
        if self._monitoring_task is not None:
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass
            self._monitoring_task = None
            logger.info(
                "[WebSocketMonitor] Мониторинг WebSocket соединений остановлен")

    def get_statistics(self) -> Dict[str, Any]:
        """
        Получение обобщённой статистики по всем соединениям.

        Returns:
            Dict[str, Any]: Словарь с обобщённой статистикой
        """
        current_time = datetime.now()
        total_connections = len(self.connections)

        # Статистика по ролям пользователей
        roles_count = {}
        for stats in self.connection_stats.values():
            role = stats.user_role or "unknown"
            roles_count[role] = roles_count.get(role, 0) + 1

        # Общая статистика сообщений и трафика
        total_messages_sent = sum(
            stats.messages_sent for stats in self.connection_stats.values())
        total_messages_received = sum(
            stats.messages_received for stats in self.connection_stats.values())
        total_bytes_sent = sum(
            stats.bytes_sent for stats in self.connection_stats.values())
        total_bytes_received = sum(
            stats.bytes_received for stats in self.connection_stats.values())

        # Статистика активности
        connection_durations = [(current_time - stats.connection_time).total_seconds()
                                for stats in self.connection_stats.values()]
        avg_connection_duration = sum(
            connection_durations) / total_connections if total_connections > 0 else 0

        # Статистика задержек ping
        ping_latencies = [stats.ping_latency for stats in self.connection_stats.values(
        ) if stats.ping_latency is not None]
        avg_ping_latency = sum(ping_latencies) / \
            len(ping_latencies) if ping_latencies else 0

        return {
            "timestamp": current_time.isoformat(),
            "total_connections": total_connections,
            "connections_by_role": roles_count,
            "messages": {
                "sent": total_messages_sent,
                "received": total_messages_received
            },
            "traffic": {
                "sent_bytes": total_bytes_sent,
                "received_bytes": total_bytes_received
            },
            "avg_connection_duration_seconds": avg_connection_duration,
            "avg_ping_latency_ms": avg_ping_latency,
        }

    def get_detailed_stats(self) -> List[Dict[str, Any]]:
        """
        Получение детальной статистики по каждому соединению.

        Returns:
            List[Dict[str, Any]]: Список статистик по соединениям
        """
        current_time = datetime.now()
        result = []

        for client_id, stats in self.connection_stats.items():
            connection_state = "unknown"
            try:
                if client_id in self.connections:
                    websocket = self.connections[client_id]
                    connection_state = str(websocket.client_state)
            except Exception:
                pass

            connection_duration = (
                current_time - stats.connection_time).total_seconds()
            inactivity_duration = (
                current_time - stats.last_activity).total_seconds()

            result.append({
                "client_id": client_id,
                "user_id": stats.user_id,
                "user_role": stats.user_role,
                "state": connection_state,
                "connection_time": stats.connection_time.isoformat(),
                "connection_duration_seconds": connection_duration,
                "last_activity": stats.last_activity.isoformat(),
                "inactivity_seconds": inactivity_duration,
                "messages_sent": stats.messages_sent,
                "messages_received": stats.messages_received,
                "bytes_sent": stats.bytes_sent,
                "bytes_received": stats.bytes_received,
                "ping_latency_ms": stats.ping_latency,
                "last_error": stats.last_error
            })

        return result


# Создаем глобальный экземпляр для использования в приложении
websocket_monitor = WebSocketMonitor()

# API для управления монитором


async def start_websocket_monitoring(check_interval_seconds: int = 60) -> None:
    """
    Запуск мониторинга WebSocket соединений.

    Args:
        check_interval_seconds: Интервал проверки соединений в секундах
    """
    await websocket_monitor.start_monitoring(check_interval_seconds)


async def stop_websocket_monitoring() -> None:
    """Остановка мониторинга WebSocket соединений."""
    await websocket_monitor.stop_monitoring()


def get_websocket_statistics() -> Dict[str, Any]:
    """
    Получение общей статистики WebSocket соединений.

    Returns:
        Dict[str, Any]: Обобщенная статистика
    """
    return websocket_monitor.get_statistics()


def get_detailed_websocket_stats() -> List[Dict[str, Any]]:
    """
    Получение детальной статистики по каждому WebSocket соединению.

    Returns:
        List[Dict[str, Any]]: Список статистик соединений
    """
    return websocket_monitor.get_detailed_stats()
