from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import models
import auth
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import func

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    plan_id: int
    user_id: int
    title: str
    description: Optional[str] = None
    priority: str
    deadline: datetime


class TaskUpdate(BaseModel):
    plan_id: Optional[int] = None
    user_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None


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


class PaginatedTaskResponse(BaseModel):
    """Модель ответа с пагинацией для списка задач"""
    items: List[TaskResponse]
    total: int
    limit: int
    offset: int
    has_more: bool


@router.post("", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """
    Создание новой задачи.
    Доступно только для HR и менеджеров.
    """
    if current_user.role not in ["hr", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Только HR или менеджеры могут создавать задачи"
        )
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Инвалидируем кэш аналитики при создании задачи
    from api.analytics import invalidate_analytics_cache
    invalidate_analytics_cache()

    return db_task


@router.get("", response_model=PaginatedTaskResponse)
async def get_tasks(
    plan_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(100, ge=1, le=100),  # Максимум 100 записей
    offset: int = Query(0, ge=0),           # Начинаем с 0
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """
    Получение списка задач с пагинацией и фильтрами.
    Для обычных сотрудников возвращает только их задачи.
    Для HR и менеджеров возвращает все задачи с возможностью фильтрации.
    """
    query = db.query(models.Task)

    # Фильтрация по правам доступа
    if current_user.role == "employee":
        query = query.filter(models.Task.user_id == current_user.id)

    # Применяем фильтры, если они указаны
    if plan_id is not None:
        query = query.filter(models.Task.plan_id == plan_id)
    # Сотрудники не могут фильтровать по другим пользователям
    if user_id is not None and current_user.role != "employee":
        query = query.filter(models.Task.user_id == user_id)
    if status is not None:
        query = query.filter(models.Task.status == status)
    if priority is not None:
        query = query.filter(models.Task.priority == priority)

    # Получаем общее количество записей для данного фильтра
    total_count = query.count()

    # Применяем пагинацию
    tasks = query.order_by(models.Task.deadline).offset(
        offset).limit(limit).all()

    # Формируем ответ с метаданными пагинации
    return {
        "items": tasks,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total_count
    }


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Получение информации о конкретной задаче по ID"""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )

    # Проверяем права доступа
    if current_user.role == "employee" and task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этой задаче"
        )

    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Обновление полей задачи"""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )

    # Проверяем права доступа
    if current_user.role not in ["hr", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только HR или менеджеры могут редактировать задачи"
        )

    # Обновляем поля задачи
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)

    # Инвалидируем кэш аналитики при обновлении задачи
    from api.analytics import invalidate_analytics_cache
    invalidate_analytics_cache()

    return task


@router.put("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: int,
    status: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Обновление статуса задачи"""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )

    # Проверяем права доступа
    if current_user.role == "employee" and task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к этой задаче"
        )

    # Сохраняем предыдущий статус для логирования
    previous_status = task.status

    # Обновляем статус
    task.status = status

    # Если задача завершена, устанавливаем дату завершения
    if status == "completed" and not task.completed_at:
        task.completed_at = func.now()

    db.commit()
    db.refresh(task)

    # Инвалидируем кэш аналитики при изменении статуса задачи
    from api.analytics import invalidate_analytics_cache
    invalidate_analytics_cache()

    return task


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """Удаление задачи"""
    if current_user.role not in ["hr", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только HR или менеджеры могут удалять задачи"
        )

    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Задача не найдена"
        )

    # Сохраняем некоторые данные для логирования
    task_info = {
        "id": task.id,
        "title": task.title,
        "user_id": task.user_id
    }

    # Удаляем задачу
    db.delete(task)
    db.commit()

    # Инвалидируем кэш аналитики при удалении задачи
    from api.analytics import invalidate_analytics_cache
    invalidate_analytics_cache()

    return {"message": "Задача успешно удалена", "task": task_info}
