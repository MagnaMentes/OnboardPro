from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import Dict, Any, Optional
from pydantic import BaseModel, ConfigDict

from database import get_db
import models
import auth

router = APIRouter(
    prefix="/portal",
    tags=["portal"],
    responses={404: {"description": "Not found"}},
)


class CandidateStatusResponse(BaseModel):
    """Модель ответа со статусом кандидата"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: Optional[str]
    email: str
    status: Optional[str]
    plan_id: Optional[int]
    plan_title: Optional[str] = None
    progress: float  # Процент выполненных задач
    tasks_total: int
    tasks_completed: int


class CompanyInfoResponse(BaseModel):
    """Модель ответа с информацией о компании"""
    company_name: str
    description: str
    contacts: Dict[str, str]


@router.get("/candidate/{candidate_id}", response_model=CandidateStatusResponse)
async def get_candidate_status(
    candidate_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Получение статуса кандидата в процессе онбординга.
    Требует токен доступа.
    """
    # Проверка токена для доступа к данным кандидата
    payload = auth.verify_portal_token(token)
    if not payload or payload.get("candidate_id") != candidate_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен для данного кандидата"
        )

    # Получаем пользователя с ролью candidate
    candidate = db.query(models.User).filter(
        models.User.id == candidate_id,
        models.User.role == "candidate"
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Кандидат не найден"
        )

    # Получаем план онбординга кандидата
    tasks = db.query(models.Task).filter(
        models.Task.user_id == candidate_id).all()
    tasks_total = len(tasks)
    tasks_completed = len(
        [task for task in tasks if task.status == "completed"])
    progress = tasks_completed / tasks_total if tasks_total > 0 else 0.0

    # Получаем информацию о плане
    plan_id = None
    plan_title = None
    if tasks and tasks[0].plan_id:
        plan_id = tasks[0].plan_id
        plan = db.query(models.OnboardingPlan).filter(
            models.OnboardingPlan.id == plan_id).first()
        if plan:
            plan_title = plan.title

    return {
        "id": candidate.id,
        "name": f"{candidate.first_name or ''} {candidate.last_name or ''}".strip() or None,
        "email": candidate.email,
        # используем поле department для временного хранения статуса кандидата
        "status": candidate.department,
        "plan_id": plan_id,
        "plan_title": plan_title,
        "progress": progress,
        "tasks_total": tasks_total,
        "tasks_completed": tasks_completed
    }


@router.get("/info", response_model=CompanyInfoResponse)
async def get_company_info():
    """
    Получение общей информации о компании для портала кандидатов.
    Не требует авторизации (общедоступная информация).
    """
    # В реальном приложении эта информация могла бы загружаться из базы данных
    # или конфигурационного файла. Для примера используем статические данные.
    return {
        "company_name": "OnboardPro",
        "description": "Современная платформа для автоматизации и оптимизации процесса адаптации новых сотрудников в компании.",
        "contacts": {
            "email": "hr@onboardpro.com",
            "phone": "+7 (495) 123-45-67",
            "address": "г. Москва, ул. Инновационная, 42"
        }
    }
