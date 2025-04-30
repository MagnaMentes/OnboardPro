import logging
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from telegram import Bot, Update
from telegram.ext import ContextTypes
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import requests
import os
import time
from datetime import timedelta, datetime
from dotenv import load_dotenv
import models
import json
import asyncio

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/integrations.log')
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH")
WORKABLE_API_KEY = os.getenv("WORKABLE_API_KEY")

# Настройки для механизма повторных попыток
MAX_RETRY_ATTEMPTS = 3  # Максимальное количество попыток
RETRY_DELAY = 2  # Задержка между попытками в секундах


async def send_telegram_notification(user_id: int, message: str, db: Session, retry_count=0):
    """
    Отправка уведомлений через Telegram с обработкой ошибок и повторными попытками
    """
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.telegram_id:
            raise HTTPException(
                status_code=400, detail="User has no Telegram ID")

        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        await bot.send_message(chat_id=user.telegram_id, text=message)
        logger.info(
            f"Telegram уведомление успешно отправлено пользователю ID: {user_id}")
    except Exception as e:
        logger.error(
            f"Ошибка при отправке Telegram уведомления пользователю ID {user_id}: {str(e)}")

        # Механизм повторных попыток
        if retry_count < MAX_RETRY_ATTEMPTS:
            retry_count += 1
            logger.info(
                f"Повторная попытка {retry_count}/{MAX_RETRY_ATTEMPTS} через {RETRY_DELAY} секунд...")
            await asyncio.sleep(RETRY_DELAY)
            await send_telegram_notification(user_id, message, db, retry_count)
        else:
            logger.error(
                f"Не удалось отправить уведомление после {MAX_RETRY_ATTEMPTS} попыток")
            raise HTTPException(
                status_code=500, detail=f"Failed to send notification: {str(e)}")


def create_calendar_event(user_id: int, task_id: int, db: Session, retry_count=0):
    """
    Создает событие в Google Calendar на основе задачи с обработкой ошибок и повторными попытками
    """
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        task = db.query(models.Task).filter(models.Task.id == task_id).first()

        if not user or not task:
            raise HTTPException(
                status_code=400, detail="User or task not found")

        # Проверяем наличие учетных данных Google
        if not os.path.exists(GOOGLE_CREDENTIALS_PATH):
            logger.error("Файл учетных данных Google не найден")
            raise HTTPException(
                status_code=500, detail="Google credentials file not found")

        creds = Credentials.from_authorized_user_file(
            GOOGLE_CREDENTIALS_PATH, ["https://www.googleapis.com/auth/calendar"])
        service = build("calendar", "v3", credentials=creds)

        # Добавляем больше деталей в событие для удобства пользователей
        event = {
            "summary": f"{task.title} [{task.priority.upper()}]",
            "description": f"{task.description or ''}\n\n---\nStatus: {task.status}\nPriority: {task.priority}\nCreated via OnboardPro",
            # Используем локальное время
            "start": {"dateTime": task.deadline.isoformat(), "timeZone": "Europe/Kiev"},
            "end": {"dateTime": (task.deadline + timedelta(hours=1)).isoformat(), "timeZone": "Europe/Kiev"},
            "attendees": [{"email": user.email}],
            "colorId": get_color_for_priority(task.priority),
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 24 * 60},  # За день
                    {"method": "popup", "minutes": 60}        # За час
                ]
            }
        }

        # Сохраняем ID задачи и другие метаданные в расширенных свойствах события
        # Это позволит при двусторонней синхронизации идентифицировать связанную задачу
        event["extendedProperties"] = {
            "private": {
                "onboardpro_task_id": str(task.id),
                "onboardpro_status": task.status,
                "onboardpro_last_sync": datetime.now().isoformat()
            }
        }

        # Проверяем, существует ли уже событие для этой задачи
        existing_event_id = find_event_for_task(service, task)

        if existing_event_id:
            # Обновляем существующее событие
            result = service.events().update(
                calendarId="primary",
                eventId=existing_event_id,
                body=event
            ).execute()
            logger.info(
                f"Обновлено событие в календаре для задачи ID: {task_id}")
        else:
            # Создаем новое событие
            result = service.events().insert(
                calendarId="primary",
                body=event
            ).execute()
            logger.info(
                f"Создано новое событие в календаре для задачи ID: {task_id}")

            # Сохраняем ID события в базе данных для последующей синхронизации
            # Здесь можно было бы добавить поле calendar_event_id в модель Task
            # Но так как мы не хотим модифицировать существующую модель,
            # будем использовать расширенные свойства события

        return {"status": "success", "event_id": result.get("id")}

    except HttpError as error:
        logger.error(f"Ошибка Google Calendar API: {error}")
        if retry_count < MAX_RETRY_ATTEMPTS:
            retry_count += 1
            logger.info(
                f"Повторная попытка синхронизации с календарем {retry_count}/{MAX_RETRY_ATTEMPTS} через {RETRY_DELAY} секунд...")
            time.sleep(RETRY_DELAY)
            return create_calendar_event(user_id, task_id, db, retry_count)
        else:
            raise HTTPException(
                status_code=500, detail=f"Google Calendar API error: {str(error)}")
    except Exception as error:
        logger.error(
            f"Неожиданная ошибка при создании события календаря: {error}")
        raise HTTPException(status_code=500, detail=str(error))


def find_event_for_task(service, task):
    """
    Находит ID события Google Calendar, соответствующего задаче
    """
    try:
        # Ищем события, которые соответствуют заголовку задачи и близки к дате дедлайна
        # Используем расширенное свойство для точного определения связанного события
        events_result = service.events().list(
            calendarId="primary",
            privateExtendedProperty=f"onboardpro_task_id={task.id}",
            maxResults=1
        ).execute()

        events = events_result.get("items", [])
        if events:
            return events[0]["id"]

        # Если не нашли по ID (возможно, событие было создано ранее без extended properties)
        # попробуем найти по названию и времени
        time_min = (task.deadline - timedelta(days=1)).isoformat() + "Z"
        time_max = (task.deadline + timedelta(days=1)).isoformat() + "Z"

        events_result = service.events().list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            q=task.title,
            maxResults=10
        ).execute()

        events = events_result.get("items", [])
        if events:
            # Если нашли несколько событий, берем первое
            return events[0]["id"]

        return None
    except Exception as error:
        logger.error(f"Ошибка при поиске события календаря: {error}")
        return None


def get_color_for_priority(priority):
    """
    Возвращает ID цвета для события в Google Calendar в зависимости от приоритета задачи
    """
    color_map = {
        "low": "7",     # Зеленый
        "medium": "5",  # Желтый
        "high": "11"    # Красный
    }
    return color_map.get(priority.lower(), "1")  # По умолчанию синий


def sync_calendar_task_status(task_id: int, db: Session, retry_count=0):
    """
    Синхронизирует статус задачи с событием Google Calendar
    с обработкой ошибок и повторными попытками
    """
    try:
        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        user = db.query(models.User).filter(
            models.User.id == task.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        creds = Credentials.from_authorized_user_file(
            GOOGLE_CREDENTIALS_PATH, ["https://www.googleapis.com/auth/calendar"])
        service = build("calendar", "v3", credentials=creds)

        # Получаем соответствующее событие в календаре
        event_id = find_event_for_task(service, task)

        if not event_id:
            # Если событие не существует, создаем его
            return create_calendar_event(user.id, task.id, db)

        # Получаем текущее событие
        event = service.events().get(calendarId="primary", eventId=event_id).execute()

        # Обновляем событие с новым статусом
        event_summary = f"{task.title} [{task.priority.upper()}]"
        if task.status.upper() not in event_summary:
            event_summary = f"[{task.status.upper()}] {task.title} [{task.priority.upper()}]"

        event["summary"] = event_summary
        event["description"] = f"{task.description or ''}\n\n---\nStatus: {task.status}\nPriority: {task.priority}\nUpdated via OnboardPro"
        event["colorId"] = "1" if task.status == "completed" else get_color_for_priority(
            task.priority)

        # Обновляем расширенные свойства
        if "extendedProperties" not in event:
            event["extendedProperties"] = {"private": {}}

        event["extendedProperties"]["private"].update({
            "onboardpro_task_id": str(task.id),
            "onboardpro_status": task.status,
            "onboardpro_last_sync": datetime.now().isoformat()
        })

        # Обновляем событие в календаре
        updated_event = service.events().update(
            calendarId="primary",
            eventId=event_id,
            body=event
        ).execute()

        logger.info(
            f"Событие календаря успешно обновлено для задачи ID: {task_id}")
        return {"status": "success", "event_id": updated_event["id"]}

    except HttpError as error:
        logger.error(
            f"Ошибка Google Calendar API при синхронизации статуса: {error}")
        if retry_count < MAX_RETRY_ATTEMPTS:
            retry_count += 1
            logger.info(
                f"Повторная попытка синхронизации с календарем {retry_count}/{MAX_RETRY_ATTEMPTS} через {RETRY_DELAY} секунд...")
            time.sleep(RETRY_DELAY)
            return sync_calendar_task_status(task_id, db, retry_count)
        else:
            raise HTTPException(
                status_code=500, detail=f"Google Calendar API error: {str(error)}")
    except Exception as error:
        logger.error(
            f"Непредвиденная ошибка при синхронизации с календарем: {error}")
        raise HTTPException(status_code=500, detail=str(error))


def sync_tasks_from_calendar(db: Session):
    """
    Синхронизирует задачи из Google Calendar в OnboardPro
    Эта функция может быть вызвана по расписанию для двусторонней синхронизации
    """
    try:
        logger.info("Начата синхронизация задач из Google Calendar")

        creds = Credentials.from_authorized_user_file(
            GOOGLE_CREDENTIALS_PATH, ["https://www.googleapis.com/auth/calendar"])
        service = build("calendar", "v3", credentials=creds)

        # Получаем события из календаря с метками OnboardPro
        now = datetime.utcnow().isoformat() + "Z"
        events_result = service.events().list(
            calendarId="primary",
            timeMin=now,
            maxResults=100,
            singleEvents=True,
            orderBy="startTime",
            privateExtendedProperty="onboardpro_task_id=*"
        ).execute()

        events = events_result.get("items", [])
        updated_tasks = 0

        for event in events:
            # Проверяем, содержит ли событие идентификатор задачи OnboardPro
            if "extendedProperties" in event and "private" in event["extendedProperties"]:
                props = event["extendedProperties"]["private"]
                if "onboardpro_task_id" in props:
                    task_id = int(props["onboardpro_task_id"])
                    task = db.query(models.Task).filter(
                        models.Task.id == task_id).first()

                    if task:
                        # Проверяем наличие изменений в событии
                        start_time = event.get("start", {}).get("dateTime")
                        if start_time:
                            # Преобразуем строку даты/времени в объект datetime
                            calendar_deadline = datetime.fromisoformat(
                                start_time.replace('Z', '+00:00'))

                            # Если дата в календаре изменилась, обновляем задачу
                            # Допуск в 1 минуту
                            if abs((calendar_deadline - task.deadline).total_seconds()) > 60:
                                task.deadline = calendar_deadline
                                updated_tasks += 1
                                logger.info(
                                    f"Обновлен дедлайн задачи ID: {task_id} из календаря")

        db.commit()
        logger.info(
            f"Синхронизация из календаря завершена. Обновлено задач: {updated_tasks}")
        return {"status": "success", "updated_tasks": updated_tasks}

    except Exception as error:
        logger.error(f"Ошибка при синхронизации из календаря: {error}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(error))


def import_workable_employees(db: Session = None, retry_count=0, last_import_date=None):
    """
    Импортирует сотрудников из Workable API с улучшенной обработкой ошибок и поддержкой расписания

    :param db: Сессия базы данных
    :param retry_count: Текущее количество попыток при сбое запроса
    :param last_import_date: Дата последнего импорта для получения только новых кандидатов
    :return: Список импортированных кандидатов
    """
    try:
        logger.info("Начало импорта сотрудников из Workable")

        if not WORKABLE_API_KEY:
            logger.error("Отсутствует API ключ Workable")
            raise HTTPException(
                status_code=500, detail="Workable API key not found in environment")

        headers = {"Authorization": f"Bearer {WORKABLE_API_KEY}"}

        # Параметры запроса
        params = {}

        # Если указана дата последнего импорта, добавляем её в параметры
        if last_import_date:
            params['updated_after'] = last_import_date.isoformat()

        # Добавляем фильтр только для нанятых кандидатов
        params['stage'] = 'hired'

        response = requests.get(
            "https://onboardpro.workable.com/spi/v3/candidates",
            headers=headers,
            params=params
        )

        if response.status_code != 200:
            logger.error(
                f"Ошибка API Workable: {response.status_code} - {response.text}")

            # Механизм повторных попыток
            if retry_count < MAX_RETRY_ATTEMPTS:
                retry_count += 1
                logger.info(
                    f"Повторная попытка импорта {retry_count}/{MAX_RETRY_ATTEMPTS} через {RETRY_DELAY} секунд...")
                time.sleep(RETRY_DELAY)
                return import_workable_employees(db, retry_count, last_import_date)
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to fetch Workable candidates: {response.status_code}"
                )

        candidates = response.json().get("candidates", [])
        logger.info(f"Получено {len(candidates)} кандидатов из Workable")

        if not db:
            # Возвращаем только список кандидатов, если не предоставлена сессия БД
            return candidates

        # Импортируем кандидатов в базу данных
        imported_count = 0
        updated_count = 0

        for candidate in candidates:
            email = candidate.get("email")
            if not email:
                logger.warning(
                    f"Пропущен кандидат без email: {candidate.get('name', 'Unknown')}")
                continue

            # Проверяем, существует ли пользователь
            user = db.query(models.User).filter(
                models.User.email == email).first()

            # Формируем данные пользователя из данных кандидата
            user_data = {
                "email": email,
                "role": "employee",
                "department": candidate.get("department", "New Hire"),
                "first_name": candidate.get("first_name", ""),
                "last_name": candidate.get("last_name", ""),
                "phone": candidate.get("phone", "")
            }

            if user:
                # Обновляем существующего пользователя
                for key, value in user_data.items():
                    if value:  # Обновляем только непустые поля
                        setattr(user, key, value)
                updated_count += 1
                logger.info(f"Обновлен пользователь: {email}")
            else:
                # Создаем нового пользователя с временным паролем
                temp_password = ''.join(
                    [chr(random.randint(65, 90)) for _ in range(8)])
                # В реальной системе это должен быть хеш пароля
                user_data["password"] = temp_password

                new_user = models.User(**user_data)
                db.add(new_user)
                imported_count += 1
                logger.info(f"Создан новый пользователь: {email}")

        db.commit()
        logger.info(
            f"Импорт завершен. Создано: {imported_count}, обновлено: {updated_count}")

        # Обновляем метку времени последнего успешного импорта
        return {
            "status": "success",
            "imported": imported_count,
            "updated": updated_count,
            "total": len(candidates),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as error:
        logger.error(f"Ошибка при импорте из Workable: {str(error)}")
        if db:
            db.rollback()
        raise HTTPException(status_code=500, detail=str(error))


def schedule_workable_import(db: Session):
    """
    Функция для запуска по расписанию импорта сотрудников из Workable
    Может быть вызвана планировщиком задач (например, APScheduler)
    """
    try:
        logger.info("Запущен запланированный импорт сотрудников из Workable")

        # Получаем дату последнего импорта из базы или файлового хранилища
        last_import_path = "data/workable_last_import.json"
        last_import_date = None

        try:
            if os.path.exists(last_import_path):
                with open(last_import_path, 'r') as f:
                    data = json.load(f)
                    last_import_date = datetime.fromisoformat(
                        data.get("last_import", ""))
                    logger.info(
                        f"Найдена дата последнего импорта: {last_import_date}")
        except Exception as e:
            logger.warning(f"Не удалось получить дату последнего импорта: {e}")

        # Запускаем импорт с оптимизацией (только новые данные с момента последнего импорта)
        result = import_workable_employees(
            db, last_import_date=last_import_date)

        # Сохраняем время текущего импорта
        os.makedirs(os.path.dirname(last_import_path), exist_ok=True)
        with open(last_import_path, 'w') as f:
            json.dump({"last_import": datetime.now().isoformat()}, f)

        return result

    except Exception as error:
        logger.error(
            f"Ошибка при запланированном импорте из Workable: {str(error)}")
        return {"status": "error", "detail": str(error)}


async def handle_telegram_webhook(request: Request, db: Session):
    """
    Обработчик вебхуков от Telegram с улучшенной обработкой команд и ошибок
    """
    try:
        update_data = await request.json()
        update = Update.de_json(update_data, Bot(TELEGRAM_BOT_TOKEN))

        if not update or not update.message:
            logger.warning("Получен некорректный вебхук от Telegram")
            return {"status": "error", "detail": "Invalid webhook data"}

        message = update.message

        if message.text == "/start":
            user_telegram_id = message.from_user.id
            await register_telegram_user(user_telegram_id, message.from_user.username, db)
            return {"status": "success", "command": "start"}

        elif message.text == "/tasks":
            await send_tasks_list(message.from_user.id, db)
            return {"status": "success", "command": "tasks"}

        elif message.text == "/progress":
            await send_progress_report(message.from_user.id, db)
            return {"status": "success", "command": "progress"}

        else:
            # Обработка неизвестных команд
            bot = Bot(token=TELEGRAM_BOT_TOKEN)
            await bot.send_message(
                chat_id=message.from_user.id,
                text="Неизвестная команда. Доступные команды:\n/start - Начало работы\n/tasks - Список задач\n/progress - Отчет о прогрессе"
            )
            return {"status": "success", "command": "unknown"}

    except Exception as e:
        logger.error(f"Ошибка при обработке вебхука Telegram: {str(e)}")
        return {"status": "error", "detail": str(e)}


async def register_telegram_user(telegram_id: str, username: str, db: Session):
    user = db.query(models.User).filter(
        models.User.telegram_id == telegram_id).first()
    if not user:
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        await bot.send_message(
            chat_id=telegram_id,
            text=f"Пожалуйста, перейдите по ссылке для привязки аккаунта: "
            f"https://onboardpro.example.com/link-telegram/{telegram_id}"
        )
    else:
        await send_telegram_notification(user.id, "Ваш аккаунт уже привязан к Telegram!", db)


async def send_progress_report(telegram_id: str, db: Session, retry_count=0):
    """
    Отправляет отчет о прогрессе пользователя с информацией о выполненных и
    предстоящих задачах с обработкой ошибок и повторными попытками
    """
    try:
        user = db.query(models.User).filter(
            models.User.telegram_id == telegram_id).first()
        if not user:
            bot = Bot(token=TELEGRAM_BOT_TOKEN)
            await bot.send_message(chat_id=telegram_id, text="Аккаунт не привязан! Используйте /start для привязки.")
            return

        # Получаем статистику по задачам пользователя
        all_tasks = db.query(models.Task).filter(
            models.Task.user_id == user.id).all()
        completed_tasks = [
            task for task in all_tasks if task.status == "completed"]
        pending_tasks = [
            task for task in all_tasks if task.status == "pending"]
        in_progress_tasks = [
            task for task in all_tasks if task.status == "in_progress"]

        # Вычисляем процент выполнения
        completion_percentage = (
            len(completed_tasks) / len(all_tasks)) * 100 if all_tasks else 0

        # Формируем отчет
        message = f"📊 *Отчет о прогрессе*\n\n"
        message += f"👤 *{user.first_name or 'Пользователь'} {user.last_name or ''}*\n"
        message += f"📝 Всего задач: {len(all_tasks)}\n"
        message += f"✅ Выполнено: {len(completed_tasks)} ({completion_percentage:.1f}%)\n"
        message += f"⏳ В процессе: {len(in_progress_tasks)}\n"
        message += f"⏰ Ожидают: {len(pending_tasks)}\n\n"

        # Добавляем информацию о предстоящих дедлайнах
        upcoming_deadlines = sorted([t for t in all_tasks if t.status != "completed"],
                                    key=lambda x: x.deadline)[:3]

        if upcoming_deadlines:
            message += "*Ближайшие дедлайны:*\n"
            for task in upcoming_deadlines:
                deadline_str = task.deadline.strftime("%d.%m.%Y")
                message += f"• {task.title} — {deadline_str}\n"

        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        await bot.send_message(chat_id=telegram_id, text=message, parse_mode="Markdown")
        logger.info(
            f"Отчет о прогрессе отправлен пользователю (Telegram ID: {telegram_id})")

    except Exception as e:
        logger.error(
            f"Ошибка при отправке отчета о прогрессе (Telegram ID: {telegram_id}): {str(e)}")

        # Механизм повторных попыток
        if retry_count < MAX_RETRY_ATTEMPTS:
            retry_count += 1
            logger.info(
                f"Повторная попытка отправки отчета {retry_count}/{MAX_RETRY_ATTEMPTS} через {RETRY_DELAY} секунд...")
            await asyncio.sleep(RETRY_DELAY)
            await send_progress_report(telegram_id, db, retry_count)
        else:
            logger.error(
                f"Не удалось отправить отчет о прогрессе после {MAX_RETRY_ATTEMPTS} попыток")
            bot = Bot(token=TELEGRAM_BOT_TOKEN)
            await bot.send_message(
                chat_id=telegram_id,
                text="К сожалению, произошла ошибка при формировании отчета. Пожалуйста, попробуйте позже."
            )


async def send_tasks_list(telegram_id: str, db: Session, retry_count=0):
    """
    Отправляет список активных задач пользователя с обработкой ошибок и повторными попытками
    """
    try:
        user = db.query(models.User).filter(
            models.User.telegram_id == telegram_id).first()
        if not user:
            bot = Bot(token=TELEGRAM_BOT_TOKEN)
            await bot.send_message(chat_id=telegram_id, text="Аккаунт не привязан! Используйте /start для привязки.")
            return

        tasks = db.query(models.Task).filter(
            models.Task.user_id == user.id,
            models.Task.status != "completed"
        ).order_by(models.Task.deadline).all()

        if not tasks:
            bot = Bot(token=TELEGRAM_BOT_TOKEN)
            await bot.send_message(chat_id=telegram_id, text="У вас нет активных задач. 🎉")
            return

        # Группировка задач по статусам для более информативного отображения
        tasks_by_status = {
            "in_progress": [],
            "pending": [],
            "blocked": []
        }

        for task in tasks:
            if task.status in tasks_by_status:
                tasks_by_status[task.status].append(task)

        status_emoji = {
            "pending": "⏰",
            "in_progress": "⚙️",
            "blocked": "🚫"
        }

        priority_emoji = {
            "low": "🟢",
            "medium": "🟡",
            "high": "🔴"
        }

        message = "📋 *Ваши активные задачи:*\n\n"

        # Вначале выводим задачи в процессе
        if tasks_by_status["in_progress"]:
            message += "*В процессе:*\n"
            for task in tasks_by_status["in_progress"]:
                deadline_str = task.deadline.strftime("%d.%m.%Y")
                priority = priority_emoji.get(task.priority.lower(), "")
                message += f"{priority} {task.title}\n   🗓 Срок: {deadline_str}\n\n"

        # Затем ожидающие
        if tasks_by_status["pending"]:
            message += "*Ожидают выполнения:*\n"
            for task in tasks_by_status["pending"]:
                deadline_str = task.deadline.strftime("%d.%m.%Y")
                priority = priority_emoji.get(task.priority.lower(), "")
                message += f"{priority} {task.title}\n   🗓 Срок: {deadline_str}\n\n"

        # И в конце заблокированные
        if tasks_by_status["blocked"]:
            message += "*Заблокированные:*\n"
            for task in tasks_by_status["blocked"]:
                deadline_str = task.deadline.strftime("%d.%m.%Y")
                priority = priority_emoji.get(task.priority.lower(), "")
                message += f"{priority} {task.title}\n   🗓 Срок: {deadline_str}\n\n"

        message += "\n💡 Используйте /progress для просмотра общей статистики."

        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        await bot.send_message(chat_id=telegram_id, text=message, parse_mode="Markdown")
        logger.info(
            f"Список задач отправлен пользователю (Telegram ID: {telegram_id})")

    except Exception as e:
        logger.error(
            f"Ошибка при отправке списка задач (Telegram ID: {telegram_id}): {str(e)}")

        # Механизм повторных попыток
        if retry_count < MAX_RETRY_ATTEMPTS:
            retry_count += 1
            logger.info(
                f"Повторная попытка отправки списка задач {retry_count}/{MAX_RETRY_ATTEMPTS} через {RETRY_DELAY} секунд...")
            await asyncio.sleep(RETRY_DELAY)
            await send_tasks_list(telegram_id, db, retry_count)
        else:
            logger.error(
                f"Не удалось отправить список задач после {MAX_RETRY_ATTEMPTS} попыток")
            bot = Bot(token=TELEGRAM_BOT_TOKEN)
            await bot.send_message(
                chat_id=telegram_id,
                text="К сожалению, произошла ошибка при получении списка задач. Пожалуйста, попробуйте позже."
            )


def sync_workable_candidate(candidate_id: str, db: Session):
    headers = {"Authorization": f"Bearer {WORKABLE_API_KEY}"}
    response = requests.get(
        f"https://onboardpro.workable.com/spi/v3/candidates/{candidate_id}",
        headers=headers
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=400, detail="Failed to fetch Workable candidate")

    candidate_data = response.json()

    # Создаем нового пользователя если его еще нет
    user = db.query(models.User).filter(
        models.User.email == candidate_data["email"]).first()
    if not user:
        user = models.User(
            email=candidate_data["email"],
            role="employee",
            department=candidate_data.get("department", "New Hire")
        )
        db.add(user)
        db.commit()

    return user.id
