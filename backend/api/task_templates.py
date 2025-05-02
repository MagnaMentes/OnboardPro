from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
import models
import auth
from database import get_db
from functools import lru_cache

# Кэш для хранения шаблонов задач
_templates_cache: Dict[str, Dict[str, Any]] = {}


# Pydantic-модель для создания/обновления шаблона
class TaskTemplateCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str
    duration_days: int
    role: str
    department: str

    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v):
        allowed_priorities = ["low", "medium", "high"]
        if v not in allowed_priorities:
            raise ValueError(
                f"Priority must be one of: {', '.join(allowed_priorities)}")
        return v


# Pydantic-модель для ответа
class TaskTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    priority: str
    duration_days: int
    role: str
    department: str
    created_at: datetime
    updated_at: datetime


router = APIRouter(prefix="/api/task_templates", tags=["task_templates"])


# Функция для инвалидации кэша
def invalidate_templates_cache():
    """Очистка кэша шаблонов задач"""
    global _templates_cache
    _templates_cache.clear()
    print("[Cache] Task templates cache invalidated")


# Функция для получения шаблонов с кэшированием
@lru_cache(maxsize=128)
def get_cached_templates(role: Optional[str] = None, department: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Получение кэшированных шаблонов задач с опциональной фильтрацией по роли и отделу.
    Функция кэширует результаты для повышения производительности.
    """
    cache_key = f"templates_{role}_{department}"

    if cache_key in _templates_cache:
        print(
            f"[Cache] Hit for templates with role={role}, department={department}")
        return _templates_cache[cache_key]

    # Если данных нет в кэше, нужно получить их из БД
    print(
        f"[Cache] Miss for templates with role={role}, department={department}")
    return None


@router.post("", response_model=TaskTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_task_template(
    template: TaskTemplateCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создание нового шаблона задачи.
    Только HR может создавать шаблоны задач.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can create task templates"
        )

    # Создаем новый шаблон
    db_template = models.TaskTemplate(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)

    # Инвалидируем кэш после изменений
    invalidate_templates_cache()

    return db_template


@router.get("", response_model=List[TaskTemplateResponse])
async def get_task_templates(
    role: Optional[str] = Query(None, description="Фильтр по роли"),
    department: Optional[str] = Query(None, description="Фильтр по отделу"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение списка шаблонов задач с опциональной фильтрацией по роли и отделу.
    """
    # Сначала проверяем кэш
    cached_templates = get_cached_templates(role, department)

    if cached_templates is not None:
        return [TaskTemplateResponse.model_validate(t) for t in cached_templates]

    # Если нет в кэше, запрашиваем из БД
    query = db.query(models.TaskTemplate)

    # Применяем фильтры
    if role:
        query = query.filter(models.TaskTemplate.role == role)

    if department:
        query = query.filter(models.TaskTemplate.department == department)

    # Получаем результаты
    templates = query.all()

    # Сохраняем результаты в кэш
    cache_key = f"templates_{role}_{department}"
    _templates_cache[cache_key] = templates
    print(
        f"[Cache] Stored templates with role={role}, department={department}, count={len(templates)}")

    return templates


@router.get("/{template_id}", response_model=TaskTemplateResponse)
async def get_task_template(
    template_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение шаблона задачи по ID.
    """
    template = db.query(models.TaskTemplate).filter(
        models.TaskTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task template with ID {template_id} not found"
        )

    return template


@router.put("/{template_id}", response_model=TaskTemplateResponse)
async def update_task_template(
    template_id: int,
    template_data: TaskTemplateCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновление шаблона задачи по ID.
    Только HR может изменять шаблоны задач.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can update task templates"
        )

    # Проверяем существование шаблона
    db_template = db.query(models.TaskTemplate).filter(
        models.TaskTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task template with ID {template_id} not found"
        )

    # Обновляем данные шаблона
    for key, value in template_data.model_dump().items():
        setattr(db_template, key, value)

    # Автоматически обновляем updated_at через onupdate триггер в модели

    db.commit()
    db.refresh(db_template)

    # Инвалидируем кэш после изменений
    invalidate_templates_cache()

    return db_template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_template(
    template_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Удаление шаблона задачи по ID.
    Только HR может удалять шаблоны задач.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can delete task templates"
        )

    # Проверяем существование шаблона
    template = db.query(models.TaskTemplate).filter(
        models.TaskTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task template with ID {template_id} not found"
        )

    # Проверяем, не используется ли шаблон в задачах
    tasks_with_template = db.query(models.Task).filter(
        models.Task.template_id == template_id).count()
    if tasks_with_template > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete task template: it is used in {tasks_with_template} tasks"
        )

    # Удаляем шаблон
    db.delete(template)
    db.commit()

    # Инвалидируем кэш после изменений
    invalidate_templates_cache()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
