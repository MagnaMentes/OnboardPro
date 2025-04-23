from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
from telegram import Bot, Update
from telegram.ext import ContextTypes
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import requests
import os
from datetime import timedelta
from dotenv import load_dotenv
import models
import json

load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH")
WORKABLE_API_KEY = os.getenv("WORKABLE_API_KEY")


async def send_telegram_notification(user_id: int, message: str, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.telegram_id:
        raise HTTPException(status_code=400, detail="User has no Telegram ID")
    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    await bot.send_message(chat_id=user.telegram_id, text=message)


def create_calendar_event(user_id: int, task_id: int, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not user or not task:
        raise HTTPException(status_code=400, detail="User or task not found")
    creds = Credentials.from_authorized_user_file(
        GOOGLE_CREDENTIALS_PATH, ["https://www.googleapis.com/auth/calendar"])
    service = build("calendar", "v3", credentials=creds)
    event = {
        "summary": task.title,
        "description": task.description,
        "start": {"dateTime": task.deadline.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": (task.deadline + timedelta(hours=1)).isoformat(), "timeZone": "UTC"},
        "attendees": [{"email": user.email}]
    }
    service.events().insert(calendarId="primary", body=event).execute()


def import_workable_employees():
    headers = {"Authorization": f"Bearer {WORKABLE_API_KEY}"}
    response = requests.get(
        "https://onboardpro.workable.com/spi/v3/candidates", headers=headers)
    if response.status_code != 200:
        raise HTTPException(
            status_code=400, detail="Failed to fetch Workable candidates")
    return response.json().get("candidates", [])


async def handle_telegram_webhook(request: Request, db: Session):
    update = Update.de_json(await request.json(), Bot(TELEGRAM_BOT_TOKEN))
    if update.message and update.message.text == "/start":
        user_telegram_id = update.message.from_user.id
        await register_telegram_user(user_telegram_id, update.message.from_user.username, db)
    elif update.message and update.message.text == "/tasks":
        await send_tasks_list(update.message.from_user.id, db)


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


async def send_tasks_list(telegram_id: str, db: Session):
    user = db.query(models.User).filter(
        models.User.telegram_id == telegram_id).first()
    if not user:
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        await bot.send_message(chat_id=telegram_id, text="Аккаунт не привязан!")
        return

    tasks = db.query(models.Task).filter(
        models.Task.user_id == user.id,
        models.Task.status != "completed"
    ).all()

    message = "Ваши активные задачи:\n\n"
    for task in tasks:
        message += f"📌 {task.title}\n"
        message += f"Статус: {task.status}\n"
        message += f"Дедлайн: {task.deadline.strftime('%Y-%m-%d %H:%M')}\n\n"

    bot = Bot(token=TELEGRAM_BOT_TOKEN)
    await bot.send_message(chat_id=telegram_id, text=message)


def sync_calendar_task_status(task_id: int, db: Session):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    user = db.query(models.User).filter(models.User.id == task.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    creds = Credentials.from_authorized_user_file(
        GOOGLE_CREDENTIALS_PATH, ["https://www.googleapis.com/auth/calendar"])
    service = build("calendar", "v3", credentials=creds)

    # Обновляем или создаем событие
    event = {
        "summary": f"[{task.status.upper()}] {task.title}",
        "description": task.description,
        "start": {"dateTime": task.deadline.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": (task.deadline + timedelta(hours=1)).isoformat(), "timeZone": "UTC"},
        "attendees": [{"email": user.email}],
        "colorId": "1" if task.status == "completed" else "5"
    }

    # Пытаемся найти существующее событие
    events = service.events().list(
        calendarId="primary",
        q=task.title,
        timeMin=task.deadline.isoformat() + "Z"
    ).execute()

    if events.get("items"):
        event_id = events["items"][0]["id"]
        service.events().update(calendarId="primary", eventId=event_id, body=event).execute()
    else:
        service.events().insert(calendarId="primary", body=event).execute()


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
