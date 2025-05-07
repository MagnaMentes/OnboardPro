import asyncio
import json
import logging
from typing import Dict, Set, Any, List
from starlette.websockets import WebSocket
from collections import deque
from datetime import datetime

# Настройка логирования
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Создаем обработчик файлового логирования
file_handler = logging.FileHandler("logs/websocket_manager.log")
file_handler.setLevel(logging.DEBUG)

# Формат логов
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

# Добавляем обработчик в логгер
logger.addHandler(file_handler)


class WebSocketManager:
    """
    Управляет WebSocket соединениями и отправкой обновлений в реальном времени.
    Поддерживает различные типы сообщений и целевую аудиторию.
    """

    def __init__(self):
        # Активные соединения, группированные по ID пользователя
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Связь WebSocket с данными пользователя
        self.connection_details: Dict[WebSocket, Dict[str, Any]] = {}
        # Очередь сообщений для обеспечения порядка доставки
        self.message_queue: deque = deque()
        # Время последнего сообщения для тротлинга
        self.last_message_time: Dict[int, datetime] = {}
        # Флаг, указывающий, запущен ли обработчик очередей
        self.queue_processor_running = False
        # Счетчик отправленных сообщений для мониторинга
        self.messages_sent = 0
        # Счетчик ошибок при отправке сообщений
        self.message_errors = 0
        # Блокировка для синхронизации доступа к очереди
        self.queue_lock = asyncio.Lock()
        logger.info("WebSocketManager инициализирован")

    async def connect(self, websocket: WebSocket, user_id: int, role: str):
        """Подключает нового клиента WebSocket к системе"""
        try:
            # Сохраняем WebSocket в группе соединений пользователя
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)

            # Сохраняем данные пользователя для этого соединения
            self.connection_details[websocket] = {
                "user_id": user_id,
                "role": role,
                "connected_at": datetime.now(),
                "ip": websocket.client.host if hasattr(websocket, 'client') and websocket.client else "unknown",
            }

            logger.info(
                f"WebSocket подключен: пользователь {user_id}, роль {role}, IP {websocket.client.host if hasattr(websocket, 'client') and websocket.client else 'unknown'}")

            # Запускаем обработчик очереди, если он еще не запущен
            if not self.queue_processor_running:
                asyncio.create_task(self.process_message_queue())
                self.queue_processor_running = True
                logger.info("Запущен обработчик очереди сообщений")

        except Exception as e:
            logger.error(f"Ошибка при подключении WebSocket: {str(e)}")
            if websocket in self.connection_details:
                del self.connection_details[websocket]
            # Если соединение было добавлено в активные, удаляем его
            if user_id in self.active_connections and websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            # Если у пользователя больше нет соединений, удаляем его из словаря
            if user_id in self.active_connections and not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def disconnect(self, websocket: WebSocket):
        """Обрабатывает отключение WebSocket"""
        try:
            # Находим пользователя, которому принадлежит соединение
            user_id = None
            if websocket in self.connection_details:
                user_id = self.connection_details[websocket]["user_id"]
                del self.connection_details[websocket]

            # Удаляем соединение из активных соединений пользователя
            if user_id is not None and user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                # Если у пользователя больше нет соединений, удаляем его из словаря
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                logger.info(f"WebSocket отключен: пользователь {user_id}")
            else:
                logger.warning("WebSocket отключен: неизвестный пользователь")

        except Exception as e:
            logger.error(f"Ошибка при отключении WebSocket: {str(e)}")

    async def handle_client_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Обрабатывает сообщение от клиента"""
        try:
            if websocket not in self.connection_details:
                logger.warning("Сообщение от неизвестного соединения")
                return

            user_id = self.connection_details[websocket]["user_id"]
            logger.debug(
                f"Сообщение от пользователя {user_id}: {str(message)}")

            # Обрабатываем различные типы сообщений
            if message.get("type") == "request_analytics_update":
                # Запрос на обновление аналитики
                from api.analytics import invalidate_analytics_cache
                # Инвалидируем кэш, чтобы получить свежие данные
                invalidate_analytics_cache()
                # Используем функцию из main.py для получения аналитических данных
                # Импортируем внутри функции, чтобы избежать циклической зависимости
                from main import get_analytics_data_for_websocket
                analytics_data = await get_analytics_data_for_websocket()

                # Добавляем сообщение в очередь для отправки
                async with self.queue_lock:
                    self.message_queue.append({
                        "target_user_id": user_id,
                        "type": "analytics_update",
                        "data": analytics_data,
                        "timestamp": int(datetime.now().timestamp() * 1000)
                    })
                logger.info(
                    f"Запрос аналитики от пользователя {user_id} добавлен в очередь")

            elif message.get("type") == "ping":
                # Отправляем pong напрямую без очереди
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": message.get("timestamp", int(datetime.now().timestamp() * 1000))
                }))

        except Exception as e:
            logger.error(
                f"Ошибка при обработке клиентского сообщения: {str(e)}")

    async def notify_task_status_change(self, task_data: Dict[str, Any]):
        """Оповещает всех пользователей об изменении статуса задачи"""
        try:
            logger.info(
                f"Оповещение об изменении статуса задачи {task_data.get('id')}")

            # Добавляем сообщение в очередь для всех активных пользователей
            message = {
                "target_role": "all",  # Отправляем всем
                "type": "task_status_changed",
                "data": task_data,
                "timestamp": int(datetime.now().timestamp() * 1000),
                "priority": 1  # Высокий приоритет
            }

            # Дополнительно отправляем сообщение конкретному пользователю
            if "user_id" in task_data:
                message["target_user_id"] = task_data["user_id"]

            # Добавляем сообщение в очередь
            async with self.queue_lock:
                self.message_queue.append(message)

            # Принудительно обрабатываем очередь, если сообщение высокого приоритета
            asyncio.create_task(self.process_message_queue(force=True))

        except Exception as e:
            logger.error(
                f"Ошибка при отправке оповещения об изменении статуса задачи: {str(e)}")

    async def broadcast_analytics_update(self, analytics_data: Dict[str, Any]):
        """Отправляет обновление аналитики всем HR пользователям"""
        try:
            logger.info("Трансляция обновления аналитики HR пользователям")

            # Добавляем сообщение в очередь с высоким приоритетом
            async with self.queue_lock:
                self.message_queue.append({
                    "target_role": "hr",  # Отправляем только HR пользователям
                    "type": "analytics_update",
                    "data": analytics_data,
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    "priority": 2  # Очень высокий приоритет
                })

            # Принудительно обрабатываем очередь, если есть обновление аналитики
            asyncio.create_task(self.process_message_queue(force=True))

        except Exception as e:
            logger.error(
                f"Ошибка при отправке обновления аналитики: {str(e)}")

    async def process_message_queue(self, force: bool = False):
        """Обрабатывает очередь сообщений для отправки клиентам"""
        # Если обработчик уже запущен и нет принудительной обработки, выходим
        if not force and self.queue_processor_running:
            return

        self.queue_processor_running = True

        try:
            while True:
                # Проверяем, есть ли сообщения в очереди
                if not self.message_queue:
                    # Если очередь пуста и нет принудительной обработки, завершаем цикл
                    if force:
                        break
                    # Иначе ждем новых сообщений
                    await asyncio.sleep(0.1)
                    continue

                # Получаем сообщение из очереди с блокировкой
                message = None
                async with self.queue_lock:
                    if self.message_queue:
                        # Сортируем сообщения по приоритету, если их несколько
                        if len(self.message_queue) > 1:
                            # Конвертируем deque в список для сортировки
                            messages = list(self.message_queue)
                            # Сортируем по приоритету (больше - выше приоритет)
                            messages.sort(key=lambda x: x.get(
                                "priority", 0), reverse=True)
                            message = messages[0]
                            # Удаляем это сообщение из очереди
                            self.message_queue.remove(message)
                        else:
                            message = self.message_queue.popleft()

                if not message:
                    continue

                # Обрабатываем сообщение
                await self.send_queued_message(message)

                # Небольшая задержка для предотвращения блокировки цикла событий
                await asyncio.sleep(0.01)

                # Если это была принудительная обработка, выходим после отправки сообщения
                if force:
                    break

        except Exception as e:
            logger.error(f"Ошибка в обработчике очереди сообщений: {str(e)}")
        finally:
            # Сбрасываем флаг только если не было принудительной обработки
            if not force:
                self.queue_processor_running = False

    async def send_queued_message(self, message: Dict[str, Any]):
        """Отправляет сообщение из очереди соответствующим пользователям"""
        try:
            target_user_id = message.get("target_user_id")
            target_role = message.get("target_role")

            # Подготавливаем данные для отправки
            message_data = {
                "type": message.get("type"),
                "data": message.get("data"),
                "timestamp": message.get("timestamp", int(datetime.now().timestamp() * 1000))
            }

            # Если указан конкретный пользователь
            if target_user_id is not None and target_user_id in self.active_connections:
                await self._send_to_user(target_user_id, message_data)

            # Если указана роль
            elif target_role is not None:
                if target_role == "all":
                    # Отправляем всем пользователям
                    await self._send_to_all(message_data)
                else:
                    # Отправляем пользователям с указанной ролью
                    await self._send_to_role(target_role, message_data)

        except Exception as e:
            logger.error(f"Ошибка при отправке сообщения из очереди: {str(e)}")
            self.message_errors += 1

    async def _send_to_user(self, user_id: int, message_data: Dict[str, Any]):
        """Отправляет сообщение конкретному пользователю"""
        if user_id in self.active_connections:
            connections = list(self.active_connections[user_id])
            for websocket in connections:
                try:
                    await websocket.send_text(json.dumps(message_data))
                    self.messages_sent += 1
                    logger.debug(
                        f"Сообщение отправлено пользователю {user_id}")
                except Exception as e:
                    logger.error(
                        f"Ошибка при отправке сообщения пользователю {user_id}: {str(e)}")
                    self.message_errors += 1
                    # Если соединение не активно, удаляем его
                    await self.disconnect(websocket)

    async def _send_to_role(self, role: str, message_data: Dict[str, Any]):
        """Отправляет сообщение всем пользователям с указанной ролью"""
        sent_count = 0
        for websocket, details in list(self.connection_details.items()):
            if details.get("role", "").lower() == role.lower():
                try:
                    await websocket.send_text(json.dumps(message_data))
                    self.messages_sent += 1
                    sent_count += 1
                except Exception as e:
                    logger.error(
                        f"Ошибка при отправке сообщения пользователю с ролью {role}: {str(e)}")
                    self.message_errors += 1
                    # Если соединение не активно, удаляем его
                    await self.disconnect(websocket)

        logger.info(
            f"Сообщение отправлено {sent_count} пользователям с ролью {role}")

    async def _send_to_all(self, message_data: Dict[str, Any]):
        """Отправляет сообщение всем подключенным пользователям"""
        sent_count = 0
        for user_id, connections in list(self.active_connections.items()):
            # Копируем набор соединений, чтобы избежать ошибок при модификации во время итерации
            for websocket in list(connections):
                try:
                    await websocket.send_text(json.dumps(message_data))
                    self.messages_sent += 1
                    sent_count += 1
                except Exception as e:
                    logger.error(
                        f"Ошибка при отправке сообщения пользователю {user_id}: {str(e)}")
                    self.message_errors += 1
                    # Если соединение не активно, удаляем его
                    await self.disconnect(websocket)

        logger.info(f"Сообщение отправлено {sent_count} пользователям")

    def get_stats(self):
        """Возвращает статистику работы WebSocketManager"""
        return {
            "active_connections": sum(len(conns) for conns in self.active_connections.values()),
            "unique_users": len(self.active_connections),
            "messages_sent": self.messages_sent,
            "message_errors": self.message_errors,
            "queue_size": len(self.message_queue),
            "timestamp": datetime.now().isoformat()
        }


# Создаем единственный экземпляр менеджера WebSocket для использования в приложении
websocket_manager = WebSocketManager()
