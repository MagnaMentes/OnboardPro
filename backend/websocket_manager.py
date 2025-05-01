import json
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
import logging
import asyncio

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Менеджер для управления WebSocket соединениями и отправки обновлений.
    Поддерживает группировку клиентов по ролям и токенам для таргетированных обновлений.
    """

    def __init__(self):
        # Активные соединения, сгруппированные по ролям пользователей
        self.active_connections: Dict[str, List[WebSocket]] = {
            'hr': [],
            'manager': [],
            'employee': []
        }
        # Словарь для хранения данных о пользователях по соединению
        self.user_data: Dict[WebSocket, Dict[str, Any]] = {}

        # Создаем словарь для хранения токенов пользователей (WebSocket -> user_id)
        self.socket_to_user_id: Dict[WebSocket, int] = {}
        # И обратный словарь (user_id -> список WebSocket)
        self.user_id_to_sockets: Dict[int, List[WebSocket]] = {}

        # Хранение последних данных аналитики для новых подключений
        self.latest_analytics_data: Optional[Dict[str, Any]] = None
        # Хранение последних данных задач для новых подключений
        self.latest_tasks_data: Dict[int, Dict[str, Any]] = {}

        # Набор клиентов, ожидающих обновления (для предотвращения дублирования)
        self.pending_updates: Set[WebSocket] = set()

        # Хранение временных меток последних запросов аналитики для предотвращения частых запросов
        self.last_analytics_request: Dict[WebSocket, float] = {}

        logger.info("WebSocketManager инициализирован")

    async def connect(self, websocket: WebSocket, user_id: int, role: str):
        """Подключение нового клиента WebSocket"""
        await websocket.accept()

        # Сохраняем данные о соединении
        if role in self.active_connections:
            self.active_connections[role].append(websocket)
        else:
            self.active_connections[role] = [websocket]

        # Связываем socket с user_id
        self.socket_to_user_id[websocket] = user_id

        # Добавляем socket в список сокетов пользователя
        if user_id not in self.user_id_to_sockets:
            self.user_id_to_sockets[user_id] = []
        self.user_id_to_sockets[user_id].append(websocket)

        # Сохраняем информацию о пользователе
        self.user_data[websocket] = {
            "user_id": user_id,
            "role": role
        }

        logger.info(
            f"Новое WebSocket соединение: user_id={user_id}, role={role}")

        # Отправляем приветственное сообщение
        await self.send_personal_message(
            {"type": "user_notification",
                "message": f"Соединение установлено. Ваша роль: {role}"},
            websocket
        )

        # Отправляем последние данные аналитики, если они есть и роль HR
        if role == 'hr' and self.latest_analytics_data:
            await self.send_personal_message(
                {"type": "analytics_update", "data": self.latest_analytics_data},
                websocket
            )
            logger.info(
                f"Отправлены кэшированные данные аналитики для HR пользователя {user_id}")

        # Если у пользователя есть задачи, отправляем последние данные о них
        if user_id in self.latest_tasks_data:
            await self.send_personal_message(
                {"type": "task_status_changed",
                    "data": self.latest_tasks_data[user_id]},
                websocket
            )

    async def disconnect(self, websocket: WebSocket):
        """Отключение клиента WebSocket"""
        # Получаем информацию о пользователе перед удалением
        user_info = self.user_data.get(websocket, {})
        user_id = user_info.get("user_id")
        role = user_info.get("role")

        # Удаляем соединение из всех коллекций
        if role and role in self.active_connections:
            if websocket in self.active_connections[role]:
                self.active_connections[role].remove(websocket)

        if websocket in self.socket_to_user_id:
            user_id = self.socket_to_user_id[websocket]
            del self.socket_to_user_id[websocket]

            # Удаляем из user_id_to_sockets
            if user_id in self.user_id_to_sockets:
                if websocket in self.user_id_to_sockets[user_id]:
                    self.user_id_to_sockets[user_id].remove(websocket)
                if not self.user_id_to_sockets[user_id]:
                    del self.user_id_to_sockets[user_id]

        # Удаляем из списка ожидающих обновления
        if websocket in self.pending_updates:
            self.pending_updates.remove(websocket)

        # Удаляем из словаря последних запросов аналитики
        if websocket in self.last_analytics_request:
            del self.last_analytics_request[websocket]

        # Удаляем данные пользователя
        if websocket in self.user_data:
            del self.user_data[websocket]

        logger.info(
            f"WebSocket соединение закрыто: user_id={user_id}, role={role}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        """Отправка сообщения конкретному клиенту"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Ошибка при отправке личного сообщения: {str(e)}")
            # Если произошла ошибка, отключаем соединение
            await self.disconnect(websocket)

    async def broadcast_to_role(self, message: Dict[str, Any], role: str):
        """Отправка сообщения всем пользователям с определенной ролью"""
        if role not in self.active_connections:
            return

        disconnected_websockets = []

        for websocket in self.active_connections[role]:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(
                    f"Ошибка при рассылке сообщения для роли {role}: {str(e)}")
                disconnected_websockets.append(websocket)

        # Отключаем все соединения, которые вызвали ошибку
        for websocket in disconnected_websockets:
            await self.disconnect(websocket)

    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Отправка сообщения всем подключенным клиентам"""
        for role in self.active_connections:
            await self.broadcast_to_role(message, role)

    async def broadcast_analytics_update(self, analytics_data: Dict[str, Any]):
        """Отправляет обновление аналитики всем HR пользователям"""
        # Сохраняем последние данные аналитики
        self.latest_analytics_data = analytics_data

        # Формируем сообщение для отправки
        message = {
            "type": "analytics_update",
            "data": analytics_data
        }

        # Отправляем только HR пользователям
        await self.broadcast_to_role(message, "hr")
        logger.info(
            f"Отправлено обновление аналитики для {len(self.active_connections.get('hr', []))} HR пользователей")

    async def broadcast_tasks_update(self, tasks_data: Dict[str, Any]):
        """Отправляет обновление задач всем пользователям"""
        # Формируем сообщение для отправки
        message = {
            "type": "tasks_update",
            "data": tasks_data
        }

        # Отправляем всем пользователям
        await self.broadcast_to_all(message)
        logger.info(f"Отправлено обновление задач всем пользователям")

    async def notify_task_status_change(self, task_data: Dict[str, Any]):
        """
        Оповещение о изменении статуса задачи.
        - HR и менеджеры получают данные о задаче
        - Владелец задачи (сотрудник) получает уведомление, если это его задача
        """
        # Сохраняем последние данные задачи
        if "user_id" in task_data:
            self.latest_tasks_data[task_data["user_id"]] = task_data

        # Формируем сообщения в зависимости от роли
        hr_manager_message = {
            "type": "task_status_changed",
            "data": task_data,
            "action": "refresh_analytics"
        }

        employee_message = {
            "type": "task_status_changed",
            "data": {
                "task_id": task_data["id"],
                "title": task_data["title"],
                "new_status": task_data["status"]
            },
            "action": "refresh_tasks"
        }

        # Отправляем HR и менеджерам
        await self.broadcast_to_role(hr_manager_message, "hr")
        await self.broadcast_to_role(hr_manager_message, "manager")

        # Отправляем уведомление сотруднику - владельцу задачи
        if "user_id" in task_data and task_data["user_id"] in self.user_id_to_sockets:
            for websocket in self.user_id_to_sockets[task_data["user_id"]]:
                await self.send_personal_message(employee_message, websocket)

    async def get_analytics_data_for_hr(self) -> Dict[str, Any]:
        """
        Получает аналитические данные для HR из БД.
        Использует функцию get_analytics_data_for_websocket() из main.py
        """
        from main import get_analytics_data_for_websocket

        try:
            # Получаем данные через функцию из main.py
            analytics_data = await get_analytics_data_for_websocket()
            return analytics_data
        except Exception as e:
            logger.error(
                f"Ошибка при получении аналитических данных: {str(e)}")
            return self.latest_analytics_data or {
                "task_stats": {"total": 0, "completed": 0, "completion_rate": 0},
                "feedback_stats": {"total": 0, "avg_per_user": 0, "nps": 0},
                "error": True,
                "error_message": str(e)
            }

    async def handle_client_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Обрабатывает входящие сообщения от клиентов"""
        try:
            message_type = message.get("type")
            user_info = self.user_data.get(websocket, {})
            user_id = user_info.get("user_id")
            role = user_info.get("role")

            if not user_id or not role:
                await self.send_personal_message(
                    {"type": "error", "message": "Неавторизованный запрос"},
                    websocket
                )
                return

            logger.info(
                f"Получено сообщение типа '{message_type}' от пользователя {user_id} с ролью {role}")

            if message_type == "ping":
                # Просто отвечаем pong на ping
                await self.send_personal_message({"type": "pong"}, websocket)

            elif message_type == "request_analytics_update" and role == "hr":
                # Запрос на обновление аналитики - только для HR
                # Проверяем, не слишком ли часто пользователь запрашивает аналитику
                import time
                current_time = time.time()
                last_request_time = self.last_analytics_request.get(
                    websocket, 0)

                # Минимальный интервал между запросами - 5 секунд
                if current_time - last_request_time < 5:
                    await self.send_personal_message(
                        {"type": "user_notification",
                            "message": "Слишком много запросов. Пожалуйста, подождите несколько секунд."},
                        websocket
                    )
                    return

                # Запоминаем время последнего запроса
                self.last_analytics_request[websocket] = current_time

                # Если у нас есть кэшированные данные аналитики, отправляем их
                if self.latest_analytics_data:
                    await self.send_personal_message(
                        {"type": "analytics_update",
                            "data": self.latest_analytics_data},
                        websocket
                    )
                    logger.info(
                        f"Отправлены кэшированные данные аналитики пользователю {user_id}")
                else:
                    # Если нет кэшированных данных, пытаемся получить свежие
                    try:
                        analytics_data = await self.get_analytics_data_for_hr()
                        if analytics_data:
                            self.latest_analytics_data = analytics_data
                            await self.send_personal_message(
                                {"type": "analytics_update",
                                    "data": analytics_data},
                                websocket
                            )
                            logger.info(
                                f"Отправлены свежие данные аналитики пользователю {user_id}")
                        else:
                            await self.send_personal_message(
                                {"type": "user_notification",
                                    "message": "Данные аналитики еще не доступны"},
                                websocket
                            )
                            logger.warning(
                                f"Данные аналитики недоступны для пользователя {user_id}")
                    except Exception as e:
                        logger.error(
                            f"Ошибка при получении аналитических данных: {str(e)}")
                        await self.send_personal_message(
                            {"type": "error",
                                "message": "Ошибка при получении аналитических данных"},
                            websocket
                        )

            elif message_type == "request_tasks_update":
                # Запрос на обновление задач
                # Здесь можно будет добавить логику для получения свежих данных о задачах
                # и отправки их клиенту
                await self.send_personal_message(
                    {"type": "user_notification",
                        "message": "Запрошено обновление задач"},
                    websocket
                )
                logger.info(
                    f"Пользователь {user_id} запросил обновление задач")

            else:
                # Неизвестный тип сообщения
                logger.warning(
                    f"Получен неизвестный тип сообщения: {message_type}")
                await self.send_personal_message(
                    {"type": "error",
                        "message": f"Неизвестный тип сообщения: {message_type}"},
                    websocket
                )

        except Exception as e:
            logger.error(
                f"Ошибка при обработке сообщения от клиента: {str(e)}")
            await self.send_personal_message(
                {"type": "error", "message": "Ошибка при обработке запроса"},
                websocket
            )


# Создаем глобальный экземпляр менеджера WebSocket
websocket_manager = WebSocketManager()
