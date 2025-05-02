from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import time
from pydantic import BaseModel, ConfigDict, field_validator
import models
import auth
from database import get_db
from .task_templates import invalidate_templates_cache

# Pydantic-модель для создания плана адаптации


class PlanCreate(BaseModel):
    role: str
    title: str
    description: Optional[str] = None
    template_ids: Optional[List[int]] = []  # ID шаблонов задач
    custom_tasks: Optional[List[dict]] = []  # Кастомные задачи без шаблона

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        allowed_roles = ["employee", "manager", "hr"]
        if v not in allowed_roles:
            raise ValueError(
                f"Role must be one of: {', '.join(allowed_roles)}")
        return v

# Pydantic-модель для создания задачи


class TaskCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    priority: str  # low, medium, high
    deadline: datetime

# Pydantic-модель для ответа о плане


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    title: str
    description: Optional[str] = None
    created_at: datetime
    tasks_count: Optional[int] = 0  # Количество созданных задач


router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan: PlanCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создание нового плана адаптации с возможностью добавления шаблонных и кастомных задач.
    Только HR может создавать планы адаптации.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can create plans"
        )

    # Создаем новый план
    db_plan = models.OnboardingPlan(
        role=plan.role,
        title=plan.title,
        description=plan.description
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    tasks_count = 0

    # Обрабатываем шаблонные задачи, если они указаны
    if plan.template_ids:
        templates = db.query(models.TaskTemplate).filter(
            models.TaskTemplate.id.in_(plan.template_ids)
        ).all()

        template_map = {t.id: t for t in templates}

        # Получаем пользователя, указанного для задач
        if plan.custom_tasks and len(plan.custom_tasks) > 0 and 'user_id' in plan.custom_tasks[0]:
            user_id = plan.custom_tasks[0]['user_id']
        else:
            # Если не указан пользователь, задачи создаются без привязки к пользователю
            user_id = None

        # Создаем задачи из шаблонов
        for template_id in plan.template_ids:
            if template_id in template_map:
                template = template_map[template_id]

                # Рассчитываем дедлайн на основе длительности шаблона
                deadline = datetime.now() + timedelta(days=template.duration_days)

                # Создаем задачу на основе шаблона
                db_task = models.Task(
                    plan_id=db_plan.id,
                    user_id=user_id,  # может быть None, если пользователь не указан
                    title=template.title,
                    description=template.description,
                    priority=template.priority,
                    deadline=deadline,
                    template_id=template.id  # Связь с шаблоном
                )
                db.add(db_task)
                tasks_count += 1

    # Обрабатываем кастомные задачи, если они указаны
    if plan.custom_tasks:
        for task_data in plan.custom_tasks:
            db_task = models.Task(
                plan_id=db_plan.id,
                **task_data
            )
            db.add(db_task)
            tasks_count += 1

    # Коммитим все изменения
    db.commit()

    # Формируем ответ
    result = PlanResponse(
        id=db_plan.id,
        role=db_plan.role,
        title=db_plan.title,
        description=db_plan.description,
        created_at=db_plan.created_at,
        tasks_count=tasks_count
    )

    return result


@router.get("", response_model=List[PlanResponse])
async def get_plans(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение списка всех планов адаптации.
    """
    plans = db.query(models.OnboardingPlan).all()

    # Для каждого плана подсчитываем количество задач
    result = []
    for plan in plans:
        tasks_count = db.query(models.Task).filter(
            models.Task.plan_id == plan.id).count()
        plan_data = PlanResponse(
            id=plan.id,
            role=plan.role,
            title=plan.title,
            description=plan.description,
            created_at=plan.created_at,
            tasks_count=tasks_count
        )
        result.append(plan_data)

    return result


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение плана адаптации по ID.
    """
    plan = db.query(models.OnboardingPlan).filter(
        models.OnboardingPlan.id == plan_id).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found"
        )

    # Подсчитываем количество задач для плана
    tasks_count = db.query(models.Task).filter(
        models.Task.plan_id == plan_id).count()

    result = PlanResponse(
        id=plan.id,
        role=plan.role,
        title=plan.title,
        description=plan.description,
        created_at=plan.created_at,
        tasks_count=tasks_count
    )

    return result


@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: int,
    plan_data: PlanCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновление плана адаптации. Только HR может обновлять планы.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can update plans"
        )

    # Проверяем существование плана
    db_plan = db.query(models.OnboardingPlan).filter(
        models.OnboardingPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found"
        )

    # Обновляем основные данные плана
    db_plan.role = plan_data.role
    db_plan.title = plan_data.title
    db_plan.description = plan_data.description

    db.commit()
    db.refresh(db_plan)

    # Подсчитываем количество задач для обновленного плана
    tasks_count = db.query(models.Task).filter(
        models.Task.plan_id == plan_id).count()

    result = PlanResponse(
        id=db_plan.id,
        role=db_plan.role,
        title=db_plan.title,
        description=db_plan.description,
        created_at=db_plan.created_at,
        tasks_count=tasks_count
    )

    return result


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Удаление плана адаптации. Только HR может удалять планы.
    Если с планом связаны задачи, план не может быть удален.
    """
    if current_user.role != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can delete plans"
        )

    # Проверяем существование плана
    db_plan = db.query(models.OnboardingPlan).filter(
        models.OnboardingPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found"
        )

    # Проверяем, есть ли связанные задачи
    tasks = db.query(models.Task).filter(
        models.Task.plan_id == plan_id).first()
    if tasks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete plan with associated tasks"
        )

    # Удаляем план
    db.delete(db_plan)
    db.commit()

    return None
