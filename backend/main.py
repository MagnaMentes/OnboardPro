from fastapi import FastAPI, Depends, HTTPException, status, Request, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy.sql.expression import distinct
import models
import auth
from database import engine, get_db
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from integrations import send_telegram_notification, create_calendar_event, import_workable_employees, handle_telegram_webhook, sync_calendar_task_status, sync_workable_candidate
from websocket_manager import websocket_manager
import secrets
import string
import re
import os
import shutil
import hashlib
import time
import json
from fastapi.responses import FileResponse
from pathlib import Path
import uuid

# Простая реализация кэша в памяти
analytics_cache = {}
analytics_versions = {}
CACHE_EXPIRATION_TIME = 300  # 5 минут в секундах

# Функция для генерации ключа кэша на основе параметров запроса


def generate_cache_key(endpoint: str, params: Dict[str, Any]) -> str:
    # Сортируем параметры для консистентности ключа
    sorted_params = sorted([(k, str(v))
                           for k, v in params.items() if v is not None])
    params_str = json.dumps(sorted_params)
    # Создаем хеш для получения короткого ключа
    key = hashlib.md5(f"{endpoint}:{params_str}".encode()).hexdigest()
    return key

# Функция для проверки и получения данных из кэша


def get_cached_data(endpoint: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    key = generate_cache_key(endpoint, params)
    if key in analytics_cache:
        cache_time, version, data = analytics_cache[key]
        # Проверяем срок действия кэша
        if time.time() - cache_time < CACHE_EXPIRATION_TIME:
            # Проверяем, не устарела ли версия данных
            endpoint_version = analytics_versions.get(endpoint, 0)
            if version >= endpoint_version:
                return data
    return None

# Функция для сохранения данных в кэше


def cache_data(endpoint: str, params: Dict[str, Any], data: Dict[str, Any]) -> None:
    key = generate_cache_key(endpoint, params)
    # Получаем текущую версию эндпоинта или создаем новую
    version = analytics_versions.get(endpoint, 0)
    analytics_cache[key] = (time.time(), version, data)

# Функция для инвалидации кэша при изменениях


def invalidate_analytics_cache(endpoint: Optional[str] = None) -> None:
    if endpoint:
        # Инкрементируем версию только для указанного эндпоинта
        current_version = analytics_versions.get(endpoint, 0)
        analytics_versions[endpoint] = current_version + 1
    else:
        # Инкрементируем версии для всех эндпоинтов
        for key in analytics_versions:
            analytics_versions[key] += 1


# Улучшим систему управления кэшем для гарантии актуальности данных после перезагрузки

# Глобальные переменные для управления кэшем
_analytics_cache = {}
_analytics_cache_timestamp = {}
_analytics_global_version = 0  # Глобальная версия для всей аналитики


def invalidate_analytics_cache():
    """Полная инвалидация кэша для аналитических данных"""
    global _analytics_cache, _analytics_cache_timestamp, _analytics_global_version, analytics_versions
    _analytics_cache.clear()
    _analytics_cache_timestamp.clear()

    # Увеличиваем глобальную версию, чтобы все новые запросы получали свежие данные
    _analytics_global_version += 1

    # Инкрементируем версии для всех эндпоинтов
    for key in analytics_versions:
        analytics_versions[key] += 1

    print(
        f"Кэш аналитики был инвалидирован (версия: {_analytics_global_version})")


def get_cached_analytics(cache_key, max_age_seconds=5):  # Уменьшаем время жизни кэша
    """Получение кэшированных данных аналитики, если они не устарели"""
    current_time = time.time()
    if cache_key in _analytics_cache and cache_key in _analytics_cache_timestamp:
        cache_age = current_time - _analytics_cache_timestamp[cache_key]

        # Проверяем как возраст кэша, так и его версию
        if cache_age < max_age_seconds and _analytics_cache[cache_key].get("metadata", {}).get("version", 0) == _analytics_global_version:
            return _analytics_cache[cache_key]
    return None


def set_analytics_cache(cache_key, data):
    """Сохранение данных аналитики в кэш с версией"""
    global _analytics_cache, _analytics_cache_timestamp

    # Добавляем текущую глобальную версию к метаданным, если их еще нет
    if "metadata" not in data:
        data["metadata"] = {}

    data["metadata"]["version"] = _analytics_global_version
    data["metadata"]["cached_at"] = datetime.now().isoformat()

    _analytics_cache[cache_key] = data
    _analytics_cache_timestamp[cache_key] = time.time()


app = FastAPI()

# Настройка CORS с явным указанием разрешенных источников
app.add_middleware(
    CORSMiddleware,
    # Разрешаем запросы с фронтенд сервера и из Docker-сети
    allow_origins=["http://localhost:3000", "http://localhost",
                   "http://127.0.0.1:3000", "http://127.0.0.1",
                   "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Монтирование директории static для раздачи фотографий
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health")
def health_check():
    return {"status": "healthy"}


models.Base.metadata.create_all(bind=engine)

# Убедимся, что директория для фотографий существует
PHOTOS_DIR = Path("static/photos")
PHOTOS_DIR.mkdir(parents=True, exist_ok=True)


class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    department: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    phone: str | None = None

    @field_validator('phone')
    @classmethod
    def validate_ukrainian_phone(cls, v):
        if v is None:
            return v
        # Удаляем все пробелы для проверки формата
        cleaned_number = v.replace(" ", "")
        # Проверяем украинский формат номера: +380XXXXXXXXX
        pattern = r'^\+380\d{9}$'
        if not re.match(pattern, cleaned_number):
            raise ValueError(
                'Номер телефона должен быть в украинском формате: +380 XX XXX XX XX')

        # Форматируем номер телефона в стандартном украинском формате
        # Сначала убираем все пробелы, затем добавляем их в нужных местах
        if " " not in v:  # Если номер не содержит пробелов, форматируем его
            operator_code = cleaned_number[4:6]
            first_part = cleaned_number[6:9]
            second_part = cleaned_number[9:11]
            third_part = cleaned_number[11:13]
            v = f"+380 {operator_code} {first_part} {second_part} {third_part}"
        return v


class UserUpdate(BaseModel):
    email: str
    role: str
    department: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    phone: str | None = None

    @field_validator('phone')
    @classmethod
    def validate_ukrainian_phone(cls, v):
        if v is None:
            return v
        # Удаляем все пробелы для проверки формата
        cleaned_number = v.replace(" ", "")
        # Проверяем украинский формат номера: +380XXXXXXXXX
        pattern = r'^\+380\d{9}$'
        if not re.match(pattern, cleaned_number):
            raise ValueError(
                'Номер телефона должен быть в украинском формате: +380 XX XXX XX XX')

        # Форматируем номер телефона в стандартном украинском формате
        # Сначала убираем все пробелы, затем добавляем их в нужных местах
        if " " not in v:  # Если номер не содержит пробелов, форматируем его
            operator_code = cleaned_number[4:6]
            first_part = cleaned_number[6:9]
            second_part = cleaned_number[9:11]
            third_part = cleaned_number[11:13]
            v = f"+380 {operator_code} {first_part} {second_part} {third_part}"
        return v


class PlanCreate(BaseModel):
    role: str
    title: str
    description: Optional[str] = None


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    title: str
    description: Optional[str] = None
    created_at: datetime


class TaskCreate(BaseModel):
    plan_id: int
    user_id: int
    title: str
    description: Optional[str] = None
    priority: str
    deadline: datetime


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plan_id: int
    user_id: int
    title: str
    description: Optional[str]
    priority: str
    deadline: datetime
    status: str
    created_at: datetime


class FeedbackCreate(BaseModel):
    recipient_id: int
    task_id: Optional[int] = None
    message: str


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    recipient_id: int
    task_id: Optional[int]
    message: str
    created_at: datetime


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: str
    department: Optional[str]
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    disabled: bool = False
    photo: Optional[str] = None


class TelegramConnect(BaseModel):
    telegram_id: str


class CalendarEvent(BaseModel):
    task_id: int


class AnalyticsCreate(BaseModel):
    user_id: int
    metric: str
    value: float


class AnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    metric: str
    value: float
    recorded_at: datetime


class PasswordUpdate(BaseModel):
    password: str


# Генерация случайного пароля
def generate_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))


@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(auth.get_db)):
    print(f"[LOGIN] Попытка входа пользователя: {form_data.username}")

    user = db.query(models.User).filter(
        models.User.email == form_data.username).first()
    if user is None:
        print(f"[LOGIN] Пользователь с email {form_data.username} не найден")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    print(
        f"[LOGIN] Пользователь найден: {user.email}, ID: {user.id}, роль: {user.role}")

    # Проверяем пароль
    if not auth.verify_password(form_data.password, user.password):
        print(f"[LOGIN] Неверный пароль для пользователя {user.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    print(f"[LOGIN] Пароль верифицирован для пользователя {user.email}")

    # Проверка, не заблокирован ли пользователь
    if user.disabled:
        print(f"[LOGIN] Пользователь {user.email} заблокирован")
        raise HTTPException(status_code=403, detail="User is disabled")

    # Создаем JWT токен
    access_token = auth.create_access_token(data={"sub": user.email})
    print(
        f"[LOGIN] Создан токен для пользователя {user.email}: {access_token[:20]}...")

    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "role": user.role}


@app.post("/users")
async def create_user(user: UserCreate, db: Session = Depends(auth.get_db)):
    hashed_password = auth.pwd_context.hash(user.password)
    db_user = models.User(
        email=user.email,
        password=hashed_password,
        role=user.role,
        department=user.department,
        first_name=user.first_name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        phone=user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"email": db_user.email, "role": db_user.role}


@app.get("/users/me")
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {"email": current_user.email, "role": current_user.role, "department": current_user.department}


@app.put("/users/{user_id}/password")
async def update_user_password(
    user_id: int,
    password_data: PasswordUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can update passwords")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404, detail="User not found")

    user.password = auth.pwd_context.hash(password_data.password)
    db.commit()
    return {"message": "Password updated successfully"}


@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Обновление данных пользователя"""
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Только HR может изменять данные пользователей"
        )

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    db_user.email = user_data.email
    db_user.role = user_data.role
    db_user.department = user_data.department
    db_user.first_name = user_data.first_name
    db_user.last_name = user_data.last_name
    db_user.middle_name = user_data.middle_name
    db_user.phone = user_data.phone

    db.commit()
    db.refresh(db_user)
    return db_user


@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Удаление пользователя"""
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Только HR может удалять пользователей"
        )

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Проверяем, что пользователь не пытается удалить сам себя
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Нельзя удалить собственный аккаунт"
        )

    db.delete(db_user)
    db.commit()
    return {"message": "Пользователь успешно удален"}


@app.patch("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Блокирование/разблокирование пользователя"""
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Только HR может блокировать/разблокировать пользователей"
        )

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Проверяем, что пользователь не пытается заблокировать сам себя
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Нельзя заблокировать собственный аккаунт"
        )

    # Инвертируем состояние
    db_user.disabled = not db_user.disabled

    db.commit()
    db.refresh(db_user)

    status_message = "заблокирован" if db_user.disabled else "разблокирован"
    return {"message": f"Пользователь {db_user.email} {status_message}"}


@app.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Сброс пароля пользователя"""
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Только HR может сбрасывать пароли пользователей"
        )

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Генерируем новый случайный пароль
    new_password = generate_password()

    # Хешируем и сохраняем новый пароль
    db_user.password = auth.pwd_context.hash(new_password)
    db.commit()

    # В реальном приложении здесь нужно отправить новый пароль на email пользователя
    # Но в демонстрационных целях просто возвращаем его
    return {
        "message": f"Пароль пользователя {db_user.email} сброшен",
        "temp_password": new_password  # В продакшн-версии этого быть не должно!
    }


@app.post("/plans", response_model=PlanResponse)
async def create_plan(
    plan: PlanCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role != "hr":
        raise HTTPException(status_code=403, detail="Only HR can create plans")
    db_plan = models.OnboardingPlan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.get("/plans", response_model=List[PlanResponse])
async def get_plans(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    return db.query(models.OnboardingPlan).all()


@app.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: int,
    plan_update: PlanCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role != "hr":
        raise HTTPException(status_code=403, detail="Only HR can update plans")

    db_plan = db.query(models.OnboardingPlan).filter(
        models.OnboardingPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Обновляем поля плана
    for key, value in plan_update.model_dump().items():
        setattr(db_plan, key, value)

    db.commit()
    db.refresh(db_plan)
    return db_plan


@app.delete("/plans/{plan_id}", response_model=dict)
async def delete_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role != "hr":
        raise HTTPException(status_code=403, detail="Only HR can delete plans")

    # Проверяем, что план существует
    db_plan = db.query(models.OnboardingPlan).filter(
        models.OnboardingPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Проверяем, привязаны ли задачи к этому плану
    tasks = db.query(models.Task).filter(
        models.Task.plan_id == plan_id).first()
    if tasks:
        raise HTTPException(
            status_code=400, detail="Cannot delete plan with associated tasks")

    # Удаляем план
    db.delete(db_plan)
    db.commit()

    return {"message": "Plan deleted successfully"}


@app.post("/tasks", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role not in ["hr", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Only HR or managers can create tasks"
        )
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Инвалидируем кэш аналитики при создании новой задачи
    invalidate_analytics_cache()

    # Получаем полные данные о задаче для отправки через WebSocket
    task_data = {
        "id": db_task.id,
        "title": db_task.title,
        "description": db_task.description,
        "status": db_task.status,
        "priority": db_task.priority,
        "user_id": db_task.user_id,
        "plan_id": db_task.plan_id
    }

    # Отправляем оповещение о создании задачи через WebSocket
    await websocket_manager.notify_task_status_change(task_data)

    # Обновляем аналитику в реальном времени
    analytics_data = await get_analytics_data_for_websocket()
    await websocket_manager.broadcast_analytics_update(analytics_data)

    return db_task


@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role == "employee":
        return db.query(models.Task).filter(
            models.Task.user_id == current_user.id
        ).all()
    return db.query(models.Task).all()


@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Обновление всех полей задачи"""
    # Проверяем права доступа (только HR может редактировать задачи)
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403,
            detail="Только HR может редактировать задачи"
        )

    # Проверяем существование задачи
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    # Обновляем поля задачи
    task.plan_id = task_update.plan_id
    task.user_id = task_update.user_id
    task.title = task_update.title
    task.description = task_update.description
    task.priority = task_update.priority
    task.deadline = task_update.deadline

    # Сохраняем изменения
    db.commit()
    db.refresh(task)

    # Инвалидируем кэш аналитики при изменении задачи
    invalidate_analytics_cache()

    return task


@app.put("/tasks/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: int,
    status: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "employee" and task.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to update this task")

    # Запоминаем предыдущее состояние для логирования
    previous_status = task.status

    task.status = status
    db.commit()
    db.refresh(task)

    # Инвалидируем кэш аналитики при изменении статуса задачи
    invalidate_analytics_cache()

    # Получаем полные данные о задаче для отправки через WebSocket
    task_data = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "user_id": task.user_id,
        "plan_id": task.plan_id,
        "previous_status": previous_status  # Добавляем информацию о предыдущем статусе
    }

    # Отправляем оповещение о изменении статуса задачи через WebSocket
    await websocket_manager.notify_task_status_change(task_data)

    # Всегда отправляем обновление аналитики при любом изменении статуса
    # Получаем свежие данные аналитики
    analytics_data = await get_analytics_data_for_websocket()
    # Отправляем через WebSocket HR пользователям
    await websocket_manager.broadcast_analytics_update(analytics_data)

    return task


@app.delete("/tasks/{task_id}")
async def delete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Удаление задачи"""
    if current_user.role not in ["hr", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Only HR or managers can delete tasks"
        )

    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Сохраняем некоторые данные задачи перед удалением для уведомлений
    task_data = {
        "id": task.id,
        "title": task.title,
        "user_id": task.user_id,
        "status": "deleted",  # Устанавливаем специальный статус для удаления
        "priority": task.priority
    }

    db.delete(task)
    db.commit()

    # Инвалидируем кэш аналитики при удалении задачи
    invalidate_analytics_cache()

    # Отправляем оповещение о удалении задачи через WebSocket
    await websocket_manager.notify_task_status_change(task_data)

    # Обновляем аналитику в реальном времени
    analytics_data = await get_analytics_data_for_websocket()
    await websocket_manager.broadcast_analytics_update(analytics_data)

    return {"message": "Task deleted successfully"}


@app.post("/feedback", response_model=FeedbackResponse)
async def create_feedback(
    feedback: FeedbackCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    db_feedback = models.Feedback(
        sender_id=current_user.id,
        recipient_id=feedback.recipient_id,
        task_id=feedback.task_id,
        message=feedback.message
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@app.get("/feedback", response_model=List[FeedbackResponse])
async def get_feedback(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role == "employee":
        return db.query(models.Feedback).filter(
            models.Feedback.recipient_id == current_user.id
        ).all()
    return db.query(models.Feedback).all()


@app.get("/users", response_model=List[UserResponse])
async def get_users(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role not in ["manager", "hr"]:
        raise HTTPException(
            status_code=403,
            detail="Only managers or HR can view profiles"
        )
    return db.query(models.User).all()


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user


@app.delete("/users/all")
async def delete_all_users(db: Session = Depends(auth.get_db)):
    db.query(models.User).delete()
    db.commit()
    return {"message": "All users deleted successfully"}


@app.post("/users/{user_id}/photo", response_model=UserResponse)
async def upload_user_photo(
    user_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Загрузка фотографии пользователя"""
    # Проверяем права доступа (только HR может загружать фото других пользователей)
    if current_user.role != "hr" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для загрузки фотографии этого пользователя"
        )

    # Проверяем существование пользователя
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Проверяем тип файла (разрешаем только изображения)
    content_type = file.content_type
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Разрешены только файлы изображений (jpg, png, gif)"
        )

    # Получаем расширение файла из MIME типа
    ext = content_type.split("/")[1]
    if ext == "jpeg":
        ext = "jpg"

    # Формируем уникальное имя файла, включая ID пользователя
    file_name = f"user_{user_id}_{uuid.uuid4().hex}.{ext}"
    file_path = PHOTOS_DIR / file_name

    # Удаляем предыдущую фотографию пользователя, если она существует
    if user.photo:
        old_photo_path = Path("static") / user.photo.split("/static/")[1]
        if old_photo_path.exists():
            old_photo_path.unlink()

    # Сохраняем новую фотографию
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Обновляем путь к фотографии в базе данных
    # Путь должен быть доступен через URL
    user.photo = f"/static/photos/{file_name}"
    db.commit()
    db.refresh(user)

    return user


@app.delete("/users/{user_id}/photo")
async def delete_user_photo(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Удаление фотографии пользователя"""
    # Проверяем права доступа (только HR или сам пользователь)
    if current_user.role != "hr" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Недостаточно прав для удаления фотографии этого пользователя"
        )

    # Проверяем существование пользователя
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Проверяем наличие фотографии у пользователя
    if not user.photo:
        return {"message": "У пользователя нет фотографии"}

    # Удаляем файл фотографии
    photo_path = Path("static") / user.photo.split("/static/")[1]
    if photo_path.exists():
        photo_path.unlink()

    # Обновляем данные пользователя
    user.photo = None
    db.commit()

    return {"message": "Фотография пользователя успешно удалена"}


@app.post("/integrations/telegram")
async def connect_telegram(
    data: TelegramConnect,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    current_user.telegram_id = data.telegram_id
    db.commit()
    return {"message": "Telegram connected"}


@app.post("/integrations/calendar")
async def create_calendar(
    data: CalendarEvent,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can create calendar events")
    create_calendar_event(current_user.id, data.task_id, db)
    return {"message": "Calendar event created"}


@app.post("/integrations/workable")
async def import_workable(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can import employees")
    candidates = import_workable_employees()

    for candidate in candidates:
        email = candidate.get("email")
        if email and not db.query(models.User).filter(models.User.email == email).first():
            db_user = models.User(
                email=email,
                password=auth.pwd_context.hash("default123"),
                role="employee",
                department=candidate.get("department", "N/A")
            )
            db.add(db_user)

    db.commit()
    return {"message": "Employees imported"}


@app.post("/notifications/telegram")
async def notify_telegram(
    user_id: int,
    message: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can send notifications")
    await send_telegram_notification(user_id, message, db)
    return {"message": "Notification sent"}


@app.post("/webhook/telegram")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Обработка вебхуков от Telegram бота"""
    return await handle_telegram_webhook(request, db)


@app.post("/api/tasks/{task_id}/sync-calendar")
async def sync_task_to_calendar(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Синхронизация задачи с Google Calendar"""
    return sync_calendar_task_status(task_id, db)


@app.post("/api/workable/sync/{candidate_id}")
async def sync_workable_candidate(
    candidate_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Синхронизация кандидата из Workable"""
    if current_user.role != "admin" and current_user.role != "hr":
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return sync_workable_candidate(candidate_id, db)


@app.post("/analytics", response_model=AnalyticsResponse)
async def create_analytics(
    data: AnalyticsCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can record analytics")
    db_analytics = models.Analytics(**data.model_dump())
    db.add(db_analytics)
    db.commit()
    db.refresh(db_analytics)
    return db_analytics


@app.get("/analytics", response_model=List[AnalyticsResponse])
async def get_analytics(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can view analytics")
    return db.query(models.Analytics).all()


@app.get("/analytics/summary")
async def get_analytics_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    department: Optional[str] = None,
    refresh: bool = False,  # Новый параметр для принудительного обновления
    timestamp: Optional[str] = None,  # Используется для обхода кэша браузера
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Получение сводной аналитики для HR-дашборда с фильтрами по дате и отделу"""
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can view analytics")

    # Пропускаем кэш, если запрошено принудительное обновление
    if not refresh:
        # Проверяем кэш перед выполнением запроса
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }

        # Пытаемся получить данные из кэша с учетом более короткого срока жизни
        cached_data = get_cached_analytics(generate_cache_key(
            "analytics_summary", cache_params), max_age_seconds=2)
        if cached_data:
            # Если данные найдены в кэше и не устарели, возвращаем их
            return cached_data

    # Если кэш не найден или запрошено обновление, выполняем запрос к БД
    # Базовый запрос для задач
    task_query = db.query(models.Task)
    completed_task_query = db.query(models.Task).filter(
        models.Task.status == "completed")

    # Применяем фильтрацию по датам к задачам, если указаны
    if start_date:
        task_query = task_query.filter(models.Task.created_at >= start_date)
        completed_task_query = completed_task_query.filter(
            models.Task.created_at >= start_date)
    if end_date:
        task_query = task_query.filter(models.Task.created_at <= end_date)
        completed_task_query = completed_task_query.filter(
            models.Task.created_at <= end_date)

    # Фильтрация по отделу требует join с таблицей пользователей
    if department:
        task_query = task_query.join(models.User, models.Task.user_id == models.User.id) \
            .filter(models.User.department == department)
        completed_task_query = completed_task_query.join(models.User, models.Task.user_id == models.User.id) \
            .filter(models.User.department == department)

    # Получаем статистику по задачам с применёнными фильтрами
    total_tasks = task_query.count()
    completed_tasks = completed_task_query.count()
    completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0

    # Статистика по отзывам с учётом фильтров
    feedback_query = db.query(models.Feedback)

    if start_date or end_date or department:
        feedback_query = feedback_query.join(
            models.User, models.Feedback.recipient_id == models.User.id)

    if start_date:
        feedback_query = feedback_query.filter(
            models.Feedback.created_at >= start_date)
    if end_date:
        feedback_query = feedback_query.filter(
            models.Feedback.created_at <= end_date)
    if department:
        feedback_query = feedback_query.filter(
            models.User.department == department)

    total_feedback = feedback_query.count()

    # Средний рейтинг отзывов по пользователям
    if department:
        users_count = db.query(models.User).filter(
            models.User.department == department).count()
    else:
        users_count = db.query(models.User).count()

    avg_feedback_per_user = total_feedback / users_count if users_count > 0 else 0

    # Дополнительная статистика по приоритетам задач
    priority_stats = {}
    for priority in ["low", "medium", "high"]:
        priority_query = task_query.filter(models.Task.priority == priority)
        priority_stats[priority] = {
            "total": priority_query.count(),
            "completed": priority_query.filter(models.Task.status == "completed").count()
        }

    # Расчет NPS (Net Promoter Score) из отзывов, если есть
    nps = 0
    try:
        # Предполагаем, что у отзывов есть поле rating или можно вычислить NPS как-то иначе
        # Это просто пример - адаптируйте под свою схему данных
        ratings_query = db.query(func.avg(models.Feedback.rating)) \
            .filter(models.Feedback.rating.isnot(None))

        if department:
            ratings_query = ratings_query.join(models.User, models.Feedback.recipient_id == models.User.id) \
                .filter(models.User.department == department)

        if start_date:
            ratings_query = ratings_query.filter(
                models.Feedback.created_at >= start_date)
        if end_date:
            ratings_query = ratings_query.filter(
                models.Feedback.created_at <= end_date)

        avg_rating = ratings_query.scalar() or 0

        # Преобразуем среднюю оценку в NPS (-100 до 100)
        nps = (avg_rating - 5) * 20  # Предполагая, что рейтинг от 0 до 10
    except Exception:
        # Если расчет не удался, оставляем NPS = 0
        pass

    # Подготавливаем результат с метаданными версионирования
    timestamp = datetime.now().isoformat()
    version = int(time.time() * 1000)  # Уникальная версия для каждого запроса

    result = {
        "task_stats": {
            "total": total_tasks,
            "completed": completed_tasks,
            "completion_rate": completion_rate,
            "priority": priority_stats
        },
        "feedback_stats": {
            "total": total_feedback,
            "avg_per_user": avg_feedback_per_user,
            "nps": nps
        },
        "filters_applied": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        },
        "metadata": {
            "generated_at": timestamp,
            "version": version,
            "fresh_data": True,  # Флаг, указывающий на свежесть данных
            "global_version": _analytics_global_version
        }
    }

    # Сохраняем результат в кэш только если не было запроса на обновление
    if not refresh:
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }
        set_analytics_cache(generate_cache_key(
            "analytics_summary", cache_params), result)

    return result


@app.get("/analytics/tasks")
async def get_task_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    department: Optional[str] = None,
    export_csv: bool = False,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """
    Получение аналитики по задачам с возможностью экспорта в CSV

    - start_date: фильтр по дате начала
    - end_date: фильтр по дате окончания
    - department: фильтрация по отделу
    - export_csv: если True, возвращает CSV файл вместо JSON
    """
    from fastapi.responses import StreamingResponse
    import io
    import csv
    from sqlalchemy.orm import joinedload

    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can view task analytics"
        )

    # Для CSV экспорта мы не используем кэширование
    if not export_csv:
        # Проверяем кэш перед выполнением запроса
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }

        # Пытаемся получить данные из кэша
        cached_data = get_cached_data("analytics_tasks", cache_params)
        if cached_data:
            # Если данные найдены в кэше, возвращаем их
            return cached_data

    # Оптимизированный запрос с использованием joinedload для избежания проблемы N+1
    query = db.query(models.Task).options(
        joinedload(models.Task.assignee)
    )

    # Применяем фильтры
    if start_date:
        query = query.filter(models.Task.created_at >= start_date)
    if end_date:
        query = query.filter(models.Task.created_at <= end_date)
    if department:
        query = query.join(models.User, models.Task.user_id == models.User.id)\
            .filter(models.User.department == department)

    # Получаем все задачи одним запросом (избегаем N+1 проблему)
    tasks = query.all()

    # Подготавливаем данные для ответа или экспорта
    tasks_data = []
    for task in tasks:
        # Используем уже загруженную связь с assignee (нет дополнительных запросов)
        assignee = task.assignee
        task_data = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "status": task.status,
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "created_at": task.created_at.isoformat() if task.created_at else None,
            "assignee_id": task.user_id,
            "assignee_name": f"{assignee.first_name} {assignee.last_name}" if assignee and assignee.first_name and assignee.last_name else assignee.email if assignee else "Не назначен",
            "department": assignee.department if assignee else "Неизвестно",
            "plan_id": task.plan_id
        }
        tasks_data.append(task_data)

    # Экспорт в CSV если запрошено
    if export_csv:
        output = io.StringIO()
        writer = csv.DictWriter(
            output, fieldnames=tasks_data[0].keys() if tasks_data else [])
        writer.writeheader()
        writer.writerows(tasks_data)

        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv"
        )
        response.headers[
            "Content-Disposition"] = f"attachment; filename=tasks_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return response

    # Для больших данных: ограничиваем количество задач, возвращаемых в JSON
    MAX_TASKS_IN_RESPONSE = 500
    if len(tasks_data) > MAX_TASKS_IN_RESPONSE:
        # Отсортируем по дате создания и вернем самые новые
        tasks_data = sorted(tasks_data,
                            key=lambda x: x["created_at"] if x["created_at"] else "0000",
                            reverse=True)[:MAX_TASKS_IN_RESPONSE]

    # Дополнительная аналитика для JSON-ответа
    total_tasks = len(tasks_data)
    completed_tasks = sum(
        1 for task in tasks_data if task["status"] == "completed")

    # Статистика по приоритетам
    priority_counts = {"low": 0, "medium": 0, "high": 0}
    for task in tasks_data:
        if task["priority"] in priority_counts:
            priority_counts[task["priority"]] += 1

    # Статистика по отделам
    department_stats = {}
    for task in tasks_data:
        dept = task["department"]
        if dept not in department_stats:
            department_stats[dept] = {"total": 0, "completed": 0}

        department_stats[dept]["total"] += 1
        if task["status"] == "completed":
            department_stats[dept]["completed"] += 1

    # Рассчитываем процент выполнения для каждого отдела
    for dept in department_stats:
        total = department_stats[dept]["total"]
        completed = department_stats[dept]["completed"]
        department_stats[dept]["completion_rate"] = completed / \
            total if total > 0 else 0

    # Подготавливаем результат с метаданными версионирования
    timestamp = datetime.now().isoformat()
    result = {
        "tasks": tasks_data,
        "summary": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": completed_tasks / total_tasks if total_tasks > 0 else 0,
            "priority_distribution": priority_counts,
            "department_stats": department_stats
        },
        "filters_applied": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        },
        "metadata": {
            "generated_at": timestamp,
            "version": analytics_versions.get("analytics_tasks", 0),
            "truncated": len(tasks_data) > MAX_TASKS_IN_RESPONSE
        }
    }

    # Сохраняем результат в кэш (только JSON, не CSV)
    if not export_csv:
        cache_data("analytics_tasks", cache_params, result)

    return result


@app.get("/analytics/users")
async def get_user_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    department: Optional[str] = None,
    export_csv: bool = False,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """
    Получение аналитики по пользователям

    - start_date: фильтр по дате начала
    - end_date: фильтр по дате окончания
    - department: фильтрация по отделу
    - export_csv: если True, возвращает CSV файл вместо JSON
    """
    from fastapi.responses import StreamingResponse
    import io
    import csv

    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can view user analytics"
        )

    # Проверяем кэш перед выполнением запроса (кроме экспорта в CSV)
    if not export_csv:
        cache_params = {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        }
        cached_data = get_cached_data("analytics_users", cache_params)
        if cached_data:
            return cached_data

    # Базовый запрос пользователей с фильтрами
    users_query = db.query(models.User)

    # Применяем фильтр по отделу, если указан
    if department:
        users_query = users_query.filter(models.User.department == department)

    users = users_query.all()
    users_data = []

    for user in users:
        # Запрос задач пользователя
        task_query = db.query(models.Task).filter(
            models.Task.user_id == user.id)

        # Фильтрация по датам
        if start_date:
            task_query = task_query.filter(
                models.Task.created_at >= start_date)
        if end_date:
            task_query = task_query.filter(models.Task.created_at <= end_date)

        # Получаем все задачи и завершенные задачи
        all_tasks = task_query.all()
        completed_tasks = [
            task for task in all_tasks if task.status == "completed"]
        tasks_total = len(all_tasks)
        tasks_completed = len(completed_tasks)

        # Расчет времени онбординга (разница между датой создания и датой последней завершенной задачи)
        onboarding_time = None
        if tasks_completed > 0 and tasks_total > 0:
            # Находим дату последней завершенной задачи
            latest_completed = max(
                [task.created_at for task in completed_tasks])
            # Находим дату первой задачи
            earliest_task = min([task.created_at for task in all_tasks])
            # Расчет времени в днях
            delta = latest_completed - earliest_task
            onboarding_time = delta.days

        # Рассчитываем процент выполнения задач
        task_completion_rate = tasks_completed / tasks_total if tasks_total > 0 else 0

        user_data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "department": user.department,
            "role": user.role,
            "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
            "tasks_total": tasks_total,
            "tasks_completed": tasks_completed,
            "task_completion_rate": task_completion_rate,
            "onboarding_time": onboarding_time
        }
        users_data.append(user_data)

    # Для экспорта в CSV
    if export_csv and users_data:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=users_data[0].keys())
        writer.writeheader()
        writer.writerows(users_data)

        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv"
        )
        response.headers[
            "Content-Disposition"] = f"attachment; filename=users_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return response

    # Статистика по отделам
    departments = {}
    for user in users_data:
        dept = user["department"] or "Не указан"
        if dept not in departments:
            departments[dept] = {
                "count": 0,
                "completed_tasks": 0,
                "total_tasks": 0
            }
        departments[dept]["count"] += 1
        departments[dept]["completed_tasks"] += user["tasks_completed"]
        departments[dept]["total_tasks"] += user["tasks_total"]

    # Расчет среднего времени онбординга
    users_with_onboarding = [
        user for user in users_data if user["onboarding_time"] is not None]
    avg_onboarding_time = sum(user["onboarding_time"] for user in users_with_onboarding) / \
        len(users_with_onboarding) if users_with_onboarding else 0

    # Формируем результат
    result = {
        "users": users_data,
        "summary": {
            "total_users": len(users_data),
            "avg_onboarding_time": avg_onboarding_time,
            "departments": departments
        },
        "filters_applied": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "department": department
        },
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "version": analytics_versions.get("analytics_users", 0)
        }
    }

    # Сохраняем в кэш только для не-CSV запросов
    if not export_csv:
        cache_data("analytics_users", cache_params, result)

    return result


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# WebSocket endpoint для подключения к серверу
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """WebSocket соединение с сервером для обновлений в реальном времени"""
    # Проверка токена и получение информации о пользователе
    if not token:
        await websocket.close(code=1008, reason="Отсутствует токен авторизации")
        return

    try:
        # Проверяем токен
        payload = auth.verify_token(token)
        email = payload.get("sub")

        # Находим пользователя по email
        db: Session = next(get_db())
        user = db.query(models.User).filter(models.User.email == email).first()

        if not user:
            await websocket.close(code=1008, reason="Пользователь не найден")
            return

        # Подключаем пользователя к WebSocket
        await websocket_manager.connect(websocket, user.id, user.role)

        try:
            # Бесконечный цикл для обработки сообщений
            while True:
                # Получаем сообщение от клиента
                data = await websocket.receive_text()
                message = json.loads(data)

                # Обрабатываем сообщение
                await websocket_manager.handle_client_message(websocket, message)
        except WebSocketDisconnect:
            # При разрыве соединения удаляем пользователя из менеджера
            await websocket_manager.disconnect(websocket)
        except Exception as e:
            # Логирование ошибок
            print(f"Ошибка WebSocket: {str(e)}")
            await websocket_manager.disconnect(websocket)
    except Exception as e:
        # При ошибке авторизации закрываем соединение
        print(f"Ошибка авторизации WebSocket: {str(e)}")
        await websocket.close(code=1008, reason="Неверный токен авторизации")


async def get_analytics_data_for_websocket() -> Dict[str, Any]:
    """Получение аналитических данных для отправки через WebSocket"""
    # Создаем новую сессию БД специально для этой функции и не используем кэш
    db = next(get_db())

    try:
        # Базовый запрос для задач
        task_query = db.query(models.Task)
        completed_task_query = db.query(models.Task).filter(
            models.Task.status == "completed")

        # Получаем статистику по задачам
        total_tasks = task_query.count()
        completed_tasks = completed_task_query.count()
        completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0

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
                "completed": priority_query.filter(models.Task.status == "completed").count()
            }

        # Формируем результат с версией и меткой времени
        timestamp = datetime.now().isoformat()
        version = int(time.time() * 1000)  # Используем миллисекунды как версию

        result = {
            "task_stats": {
                "total": total_tasks,
                "completed": completed_tasks,
                "completion_rate": completion_rate,
                "priority": priority_stats
            },
            "feedback_stats": {
                "total": total_feedback,
                "avg_per_user": avg_feedback_per_user
            },
            "metadata": {
                "generated_at": timestamp,
                "real_time_update": True,
                "version": version
            }
        }

        return result
    except Exception as e:
        print(f"Ошибка при получении аналитических данных: {str(e)}")
        raise
    finally:
        db.close()
