import asyncio
import json
import logging
import time
import uuid
from typing import Dict, Set, Any, List, Optional
from starlette.websockets import WebSocket, WebSocketState
from collections import deque
from datetime import datetime

# Импортируем модуль мониторинга WebSocket
from websocket_monitor import websocket_monitor

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


# Объявляем функцию get_analytics_data_for_websocket здесь, чтобы избежать циклического импорта
async def get_analytics_data_for_websocket():
    """Получение аналитических данных для отправки через WebSocket"""
    # Импортируем внутри функции, чтобы избежать циклического импорта
    from database import get_db
    from sqlalchemy.sql import func
    import models
    import traceback

    # Создаем новую сессию БД специально для этой функции и не используем кэш
    db = next(get_db())

    try:
        logger.info("WebSocket: Начато получение аналитических данных")

        # Базовый запрос для задач
        task_query = db.query(models.Task)

        # Запросы для разных статусов задач
        completed_task_query = db.query(models.Task).filter(
            models.Task.status == "completed")
        in_progress_task_query = db.query(models.Task).filter(
            models.Task.status == "in_progress")
        pending_task_query = db.query(models.Task).filter(
            models.Task.status == "pending")

        # Получаем статистику по задачам
        total_tasks = task_query.count()
        completed_tasks = completed_task_query.count()
        in_progress_tasks = in_progress_task_query.count()
        pending_tasks = pending_task_query.count()

        completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0

        logger.info(
            f"WebSocket: Получена статистика задач: всего={total_tasks}, выполнено={completed_tasks}, в процессе={in_progress_tasks}")

        # Получаем список задач в процессе с более детальной информацией
        in_progress_tasks_details = []
        tasks_in_progress = in_progress_task_query.all()

        for task in tasks_in_progress:
            try:
                # Получаем информацию о пользователе-исполнителе
                assignee = db.query(models.User).filter(
                    models.User.id == task.user_id).first()

                # Безопасное извлечение данных с проверками на None
                task_details = {
                    "id": task.id,
                    "title": task.title if task.title else "Без названия",
                    "priority": task.priority if task.priority else "medium",
                    "status": task.status if task.status else "in_progress",
                    "created_at": task.created_at.isoformat() if task.created_at else None,
                    "deadline": task.deadline.isoformat() if task.deadline else None,
                }

                # Добавляем информацию о пользователе, если она доступна
                if assignee:
                    full_name = " ".join(
                        filter(None, [assignee.first_name, assignee.last_name])).strip()
                    task_details.update({
                        "assignee_name": full_name if full_name else assignee.email,
                        "assignee_id": assignee.id,
                        "department": assignee.department if assignee.department else "Не указано",
                        "user_id": assignee.id  # Добавляем для совместимости
                    })
                else:
                    task_details.update({
                        "assignee_name": "Не назначено",
                        "assignee_id": None,
                        "department": "Не указано",
                        "user_id": task.user_id if hasattr(task, 'user_id') else None
                    })

                in_progress_tasks_details.append(task_details)
            except Exception as e:
                logger.error(
                    f"WebSocket: Ошибка при обработке задачи {task.id}: {str(e)}")
                continue

        logger.info(
            f"WebSocket: Получено {len(in_progress_tasks_details)} задач в процессе")

        # Статистика по отзывам
        total_feedback = db.query(models.Feedback).count()

        # Средний рейтинг отзывов по пользователям
        users_count = db.query(models.User).count()
        avg_feedback_per_user = total_feedback / users_count if users_count > 0 else 0

        # Статистика по приоритетам задач
        priority_stats = {}
        for priority in ["low", "medium", "high"]:
            priority_query = task_query.filter(
                models.Task.priority == priority)
            priority_stats[priority] = {
                "total": priority_query.count(),
                "completed": priority_query.filter(models.Task.status == "completed").count(),
                "in_progress": priority_query.filter(models.Task.status == "in_progress").count(),
                "pending": priority_query.filter(models.Task.status == "pending").count()
            }

        # Формируем результат с версией и меткой времени
        timestamp = datetime.now().isoformat()
        version = int(time.time() * 1000)  # Используем миллисекунды как версию

        # Создаем структуру данных, которую ожидает фронтенд
        task_stats = {
            "total": total_tasks,
            "completed": completed_tasks,
            # Важно: правильно устанавливаем количество задач "в процессе"
            "in_progress": in_progress_tasks,
            "pending": pending_tasks,
            "completion_rate": completion_rate,
            "priority": priority_stats,
            # Добавляем детальную информацию о задачах в процессе
            "in_progress_tasks_details": in_progress_tasks_details
        }

        feedback_stats = {
            "total": total_feedback,
            "avg_per_user": avg_feedback_per_user
        }

        # Добавляем данные об онбординге
        # Используем другой способ для расчета времени онбординга
        try:
            # Получаем средний интервал между созданием задачи и текущей датой
            # для завершенных задач
            earliest_completed_task = db.query(
                func.min(models.Task.created_at)
            ).filter(
                models.Task.status == 'completed'
            ).scalar()

            latest_completed_task = db.query(
                func.max(models.Task.created_at)
            ).filter(
                models.Task.status == 'completed'
            ).scalar()

            onboarding_avg_time = 0
            if earliest_completed_task and latest_completed_task:
                # Расчет среднего времени в днях
                delta = latest_completed_task - earliest_completed_task
                onboarding_avg_time = delta.days + \
                    (delta.seconds / 86400)  # 86400 секунд в дне

            onboarding_avg_time = max(round(onboarding_avg_time, 1), 0)
        except Exception as e:
            logger.error(f"Ошибка при расчете времени онбординга: {str(e)}")
            onboarding_avg_time = 0

        # Создаем структуру, соответствующую ожиданиям фронтенда
        analytics_data = {
            "current": {
                "task_stats": task_stats,
                "feedback_stats": feedback_stats,
                "onboarding_stats": {
                    "avg_time": onboarding_avg_time,
                    "total_users": users_count
                },
                "metadata": {
                    "generated_at": timestamp,
                    "real_time_update": True,
                    "version": version
                }
            },
            # Для сравнения с предыдущим периодом (если потребуется)
            "previous": None
        }

        logger.info(
            f"WebSocket: Аналитические данные успешно подготовлены (версия: {version})")
        return analytics_data
    except Exception as e:
        logger.error(
            f"WebSocket: Ошибка при получении аналитических данных: {str(e)}")
        traceback.print_exc()  # Выводим полный стек ошибки для отладки
        return {
            "error": str(e),
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "error": True
            }
        }
    finally:
        db.close()


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

            # Генерируем уникальный идентификатор клиента для мониторинга
            client_id = f"user_{user_id}_{int(time.time())}"

            # Сохраняем данные пользователя для этого соединения
            self.connection_details[websocket] = {
                "user_id": user_id,
                "role": role,
                "connected_at": datetime.now(),
                "ip": websocket.client.host if hasattr(websocket, 'client') and websocket.client else "unknown",
                "client_id": client_id  # Добавляем идентификатор для связи с монитором
            }

            # Регистрируем соединение в мониторе WebSocket для отслеживания
            await websocket_monitor.register_connection(websocket, client_id, user_id, role)

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
            # Находим пользователя и клиентский ID, которому принадлежит соединение
            user_id = None
            client_id = None
            if websocket in self.connection_details:
                user_id = self.connection_details[websocket]["user_id"]
                client_id = self.connection_details[websocket].get("client_id")
                del self.connection_details[websocket]

            # Уведомляем монитор WebSocket об отключении, если есть client_id
            if client_id:
                websocket_monitor.unregister_connection(client_id)

            # Удаляем соединение из активных соединений пользователя
            if user_id is not None and user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                # Если у пользователя больше нет соединений, удаляем его из словаря
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                logger.info(
                    f"WebSocket отключен: пользователь {user_id}, клиент {client_id}")
            else:
                logger.warning(
                    f"WebSocket отключен: неизвестный пользователь (client_id: {client_id})")

        except Exception as e:
            logger.error(f"Ошибка при отключении WebSocket: {str(e)}")

    async def handle_client_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Обрабатывает сообщение от клиента"""
        try:
            if websocket not in self.connection_details:
                logger.warning("Сообщение от неизвестного соединения")
                return

            user_id = self.connection_details[websocket]["user_id"]
            client_id = self.connection_details[websocket].get("client_id")

            # Логируем получение сообщения
            logger.debug(
                f"Сообщение от пользователя {user_id}: {str(message)}")

            # Получаем размер сообщения для отслеживания метрик
            message_size = len(json.dumps(message).encode('utf-8'))

            # Обновляем статистику в мониторе WebSocket
            if client_id:
                await websocket_monitor.update_activity(
                    client_id,
                    received=True,
                    bytes_count=message_size,
                    message=message.get("type")
                )

            # Обрабатываем различные типы сообщений
            if message.get("type") == "request_analytics_update":
                # Запрос на обновление аналитики
                from api.analytics import invalidate_analytics_cache
                # Инвалидируем кэш, чтобы получить свежие данные
                invalidate_analytics_cache()

                # Используем локальную функцию для получения аналитических данных
                # вместо импорта из main.py (избегаем циклический импорт)
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
                pong_message = {
                    "type": "pong",
                    "timestamp": message.get("timestamp", int(datetime.now().timestamp() * 1000))
                }
                pong_json = json.dumps(pong_message)
                await websocket.send_text(pong_json)

                # Обновляем статистику отправленного pong сообщения
                if client_id:
                    await websocket_monitor.update_activity(
                        client_id,
                        sent=True,
                        bytes_count=len(pong_json.encode('utf-8')),
                        message="pong"
                    )

        except Exception as e:
            logger.error(
                f"Ошибка при обработке клиентского сообщения: {str(e)}")

            # Записываем ошибку в мониторе
            if websocket in self.connection_details:
                client_id = self.connection_details[websocket].get("client_id")
                if client_id:
                    await websocket_monitor.record_error(client_id, f"Ошибка обработки сообщения: {str(e)}")

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
                    # Получаем client_id для мониторинга
                    client_id = self.connection_details[websocket].get(
                        "client_id")

                    # Отправляем сообщение
                    message_json = json.dumps(message_data)
                    await websocket.send_text(message_json)

                    # Обновляем статистику в мониторе
                    if client_id:
                        await websocket_monitor.update_activity(
                            client_id,
                            sent=True,
                            bytes_count=len(message_json.encode("utf-8")),
                            message=message_data.get("type")
                        )

                    self.messages_sent += 1
                    logger.debug(
                        f"Сообщение отправлено пользователю {user_id}")
                except Exception as e:
                    logger.error(
                        f"Ошибка при отправке сообщения пользователю {user_id}: {str(e)}")

                    # Записываем ошибку в мониторе
                    client_id = self.connection_details.get(
                        websocket, {}).get("client_id")
                    if client_id:
                        await websocket_monitor.record_error(client_id, str(e))

                    self.message_errors += 1
                    # Если соединение не активно, удаляем его
                    await self.disconnect(websocket)

    async def _send_to_role(self, role: str, message_data: Dict[str, Any]):
        """Отправляет сообщение всем пользователям с указанной ролью"""
        sent_count = 0
        for websocket, details in list(self.connection_details.items()):
            if details.get("role", "").lower() == role.lower():
                try:
                    # Получаем client_id для мониторинга
                    client_id = details.get("client_id")

                    # Отправляем сообщение
                    message_json = json.dumps(message_data)
                    await websocket.send_text(message_json)

                    # Обновляем статистику в мониторе
                    if client_id:
                        await websocket_monitor.update_activity(
                            client_id,
                            sent=True,
                            bytes_count=len(message_json.encode("utf-8")),
                            message=message_data.get("type")
                        )

                    self.messages_sent += 1
                    sent_count += 1
                except Exception as e:
                    logger.error(
                        f"Ошибка при отправке сообщения пользователю с ролью {role}: {str(e)}")

                    # Записываем ошибку в мониторе
                    client_id = details.get("client_id")
                    if client_id:
                        await websocket_monitor.record_error(client_id, str(e))

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
                    # Получаем client_id для мониторинга
                    client_id = self.connection_details.get(
                        websocket, {}).get("client_id")

                    # Отправляем сообщение
                    message_json = json.dumps(message_data)
                    await websocket.send_text(message_json)

                    # Обновляем статистику в мониторе
                    if client_id:
                        await websocket_monitor.update_activity(
                            client_id,
                            sent=True,
                            bytes_count=len(message_json.encode("utf-8")),
                            message=message_data.get("type")
                        )

                    self.messages_sent += 1
                    sent_count += 1
                except Exception as e:
                    logger.error(
                        f"Ошибка при отправке сообщения пользователю {user_id}: {str(e)}")

                    # Записываем ошибку в мониторе
                    client_id = self.connection_details.get(
                        websocket, {}).get("client_id")
                    if client_id:
                        await websocket_monitor.record_error(client_id, str(e))

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
