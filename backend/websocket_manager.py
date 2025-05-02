from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
from typing import Dict, List, Set, Any
import json
import asyncio
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создаем файловый обработчик для логов
file_handler = logging.FileHandler('logs/websocket_manager.log')
file_handler.setLevel(logging.INFO)

# Форматирование логов
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

# Добавляем обработчик к логгеру
logger.addHandler(file_handler)


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}
        logger.info("WebSocketManager инициализирован")

    async def connect(self, websocket: WebSocket, user_id: int, role: str):
        """Подключение нового WebSocket клиента"""
        try:
            # Проверяем, если соединение уже принято
            if websocket.client_state == WebSocketState.CONNECTED:
                logger.info(
                    f"WebSocket соединение уже принято: user_id={user_id}, role={role}")

            # Добавляем в словарь активных соединений
            self.active_connections[websocket] = {
                "user_id": user_id,
                "role": role
            }
            logger.info(
                f"Новое WebSocket соединение установлено: user_id={user_id}, role={role}")
        except Exception as e:
            logger.error(
                f"Ошибка при установлении WebSocket соединения: {str(e)}")
            raise

    async def disconnect(self, websocket: WebSocket):
        """Отключение WebSocket клиента"""
        try:
            if websocket in self.active_connections:
                user_info = self.active_connections[websocket]
                del self.active_connections[websocket]
                logger.info(
                    f"WebSocket соединение закрыто: user_id={user_info.get('user_id')}, role={user_info.get('role')}")
            else:
                logger.info(
                    "WebSocket соединение закрыто: user_id=None, role=None")
        except Exception as e:
            logger.error(f"Ошибка при закрытии WebSocket соединения: {str(e)}")

    async def send_personal_message(self, message: Dict, websocket: WebSocket):
        """Отправка персонального сообщения клиенту"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(
                f"Ошибка при отправке персонального сообщения: {str(e)}")
            await self.disconnect(websocket)

    async def broadcast(self, message: Dict):
        """Отправка сообщения всем подключенным клиентам"""
        disconnected = []
        for websocket in self.active_connections:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(
                    f"Ошибка при широковещательной отправке: {str(e)}")
                disconnected.append(websocket)

        # Отключаем соединения с ошибками
        for websocket in disconnected:
            await self.disconnect(websocket)

    async def broadcast_to_role(self, message: Dict, role: str):
        """Отправка сообщения всем клиентам с определенной ролью"""
        disconnected = []
        for websocket, info in self.active_connections.items():
            if info["role"] == role:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(
                        f"Ошибка при отправке сообщения роли {role}: {str(e)}")
                    disconnected.append(websocket)

        # Отключаем соединения с ошибками
        for websocket in disconnected:
            await self.disconnect(websocket)

    async def send_to_user(self, user_id: int, message: Dict):
        """Отправка сообщения конкретному пользователю по ID"""
        disconnected = []
        sent = False
        for websocket, info in self.active_connections.items():
            if info["user_id"] == user_id:
                try:
                    await websocket.send_text(json.dumps(message))
                    sent = True
                except Exception as e:
                    logger.error(
                        f"Ошибка при отправке сообщения пользователю {user_id}: {str(e)}")
                    disconnected.append(websocket)

        # Отключаем соединения с ошибками
        for websocket in disconnected:
            await self.disconnect(websocket)

        return sent

    async def notify_task_status_change(self, task_data: Dict):
        """Отправка уведомления об изменении статуса задачи"""
        # Формируем сообщение для отправки
        message = {
            "type": "task_update",
            "data": task_data
        }

        # Отправляем сообщение HR и менеджерам
        await self.broadcast_to_role(message, "hr")
        await self.broadcast_to_role(message, "manager")

        # Если задача назначена конкретному пользователю, отправляем ему
        if "user_id" in task_data:
            user_message = {
                "type": "task_update",
                "data": {**task_data, "personal": True}
            }
            await self.send_to_user(task_data["user_id"], user_message)

    async def broadcast_analytics_update(self, analytics_data: Dict):
        """Отправка обновленных данных аналитики всем HR пользователям"""
        message = {
            "type": "analytics_update",
            "data": analytics_data
        }
        await self.broadcast_to_role(message, "hr")

    async def handle_client_message(self, websocket: WebSocket, message: Dict):
        """Обработка сообщения от клиента"""
        message_type = message.get("type", "")

        if websocket in self.active_connections:
            user_info = self.active_connections[websocket]
            user_id = user_info.get("user_id")
            role = user_info.get("role")

            if message_type == "ping":
                # Отправляем пинг обратно для проверки соединения
                logger.info(
                    f"Получено сообщение типа '{message_type}' от пользователя {user_id} с ролью {role}")
                await self.send_personal_message({"type": "pong", "timestamp": message.get("timestamp")}, websocket)
            else:
                logger.info(
                    f"Получено сообщение типа '{message_type}' от пользователя {user_id} с ролью {role}")
                # Другие типы сообщений можно обрабатывать по мере необходимости


# Создаем экземпляр менеджера WebSocket
websocket_manager = WebSocketManager()
