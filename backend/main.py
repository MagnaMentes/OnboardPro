from fastapi import FastAPI, Depends, HTTPException, status, Request, File, UploadFile
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
from datetime import datetime
from typing import Optional, List
from integrations import send_telegram_notification, create_calendar_event, import_workable_employees, handle_telegram_webhook, sync_calendar_task_status, sync_workable_candidate
import secrets
import string
import re
import os
import shutil
from fastapi.responses import FileResponse
from pathlib import Path
import uuid

app = FastAPI()

# Настройка CORS с явным указанием разрешенных источников
app.add_middleware(
    CORSMiddleware,
    # Разрешаем запросы с фронтенд сервера и из Docker-сети
    allow_origins=["http://localhost:3000",
                   "http://127.0.0.1:3000", "http://frontend:3000"],
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

    task.status = status
    db.commit()
    db.refresh(task)
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

    db.delete(task)
    db.commit()
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
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Получение сводной аналитики для HR-дашборда"""
    if current_user.role != "hr":
        raise HTTPException(
            status_code=403, detail="Only HR can view analytics")

    # Общая статистика по задачам
    total_tasks = db.query(models.Task).count()
    completed_tasks = db.query(models.Task).filter(
        models.Task.status == "completed"
    ).count()
    completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0

    # Статистика по отзывам
    total_feedback = db.query(models.Feedback).count()
    avg_feedback_per_user = db.query(
        func.count(models.Feedback.id) /
        func.count(distinct(models.Feedback.recipient_id))
    ).scalar() or 0

    return {
        "task_stats": {
            "total": total_tasks,
            "completed": completed_tasks,
            "completion_rate": completion_rate
        },
        "feedback_stats": {
            "total": total_feedback,
            "avg_per_user": avg_feedback_per_user
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
