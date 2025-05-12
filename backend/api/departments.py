from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import models
import auth
from database import get_db

router = APIRouter(prefix="/api")


class DepartmentBase(BaseModel):
    name: str
    manager_id: Optional[int] = None


class DepartmentCreate(DepartmentBase):
    pass


class Department(DepartmentBase):
    id: int
    created_at: datetime

    model_config = {
        "from_attributes": True,
        # Автоматическое преобразование datetime в строку при сериализации
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class DepartmentWithManager(Department):
    manager: Optional[dict] = None


@router.post("/departments", response_model=Department)
async def create_department(
    department: DepartmentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создание нового отдела.
    Только пользователи с ролью HR могут создавать отделы.
    """
    # Проверяем права доступа
    if current_user.role.lower() != "hr":
        raise HTTPException(
            status_code=403,
            detail="Только HR может создавать отделы"
        )

    # Проверяем, существует ли уже отдел с таким названием
    existing_department = db.query(models.Department).filter(
        models.Department.name == department.name
    ).first()
    if existing_department:
        raise HTTPException(
            status_code=400,
            detail=f"Отдел с названием '{department.name}' уже существует"
        )

    # Проверяем существование менеджера, если он указан
    if department.manager_id:
        manager = db.query(models.User).filter(
            models.User.id == department.manager_id
        ).first()
        if not manager:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь с ID {department.manager_id} не найден"
            )
        # Проверяем, что выбранный пользователь имеет роль менеджера
        if manager.role.lower() != "manager":
            raise HTTPException(
                status_code=400,
                detail=f"Пользователь с ID {department.manager_id} не является менеджером"
            )

    # Создаем новый отдел
    db_department = models.Department(
        name=department.name,
        manager_id=department.manager_id
    )
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department


@router.get("/departments", response_model=List[DepartmentWithManager])
async def get_departments(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение списка всех отделов.
    Доступно для HR и менеджеров.
    """
    # Проверяем права доступа
    if current_user.role.lower() not in ["hr", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Только HR или менеджеры могут просматривать список отделов"
        )

    departments = db.query(models.Department).all()
    result = []

    for dept in departments:
        dept_dict = {
            "id": dept.id,
            "name": dept.name,
            "manager_id": dept.manager_id,
            "created_at": dept.created_at.isoformat(),
            "manager": None
        }

        # Если у отдела есть менеджер, добавляем его данные
        if dept.manager_id:
            manager = db.query(models.User).filter(
                models.User.id == dept.manager_id
            ).first()
            if manager:
                dept_dict["manager"] = {
                    "id": manager.id,
                    "email": manager.email,
                    "first_name": manager.first_name,
                    "last_name": manager.last_name
                }

        result.append(dept_dict)

    return result


@router.get("/departments/{department_id}", response_model=DepartmentWithManager)
async def get_department(
    department_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение информации о конкретном отделе.
    Доступно для HR и менеджеров.
    """
    # Проверяем права доступа
    if current_user.role.lower() not in ["hr", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Только HR или менеджеры могут просматривать информацию об отделах"
        )

    department = db.query(models.Department).filter(
        models.Department.id == department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail=f"Отдел с ID {department_id} не найден"
        )

    result = {
        "id": department.id,
        "name": department.name,
        "manager_id": department.manager_id,
        "created_at": department.created_at.isoformat(),
        "manager": None
    }

    # Если у отдела есть менеджер, добавляем его данные
    if department.manager_id:
        manager = db.query(models.User).filter(
            models.User.id == department.manager_id
        ).first()
        if manager:
            result["manager"] = {
                "id": manager.id,
                "email": manager.email,
                "first_name": manager.first_name,
                "last_name": manager.last_name
            }

    return result


@router.get("/departments/managers/list", response_model=List[dict])
async def get_available_managers(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получение списка всех доступных менеджеров для назначения руководителями отделов.
    Доступно для HR.
    """
    # Проверяем права доступа
    if current_user.role.lower() != "hr":
        raise HTTPException(
            status_code=403,
            detail="Только HR может просматривать список доступных менеджеров"
        )

    managers = db.query(models.User).filter(
        models.User.role.ilike("manager"),
        models.User.disabled == False  # Только активные менеджеры
    ).all()

    return [
        {
            "id": manager.id,
            "email": manager.email,
            "first_name": manager.first_name,
            "last_name": manager.last_name,
            "full_name": f"{manager.last_name or ''} {manager.first_name or ''} {manager.middle_name or ''}".strip()
        }
        for manager in managers
    ]


@router.put("/departments/{department_id}", response_model=Department)
async def update_department(
    department_id: int,
    department_update: DepartmentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Обновление информации об отделе.
    Только пользователи с ролью HR могут обновлять отделы.
    """
    # Проверяем права доступа
    if current_user.role.lower() != "hr":
        raise HTTPException(
            status_code=403,
            detail="Только HR может обновлять информацию об отделах"
        )

    # Проверяем существование отдела
    department = db.query(models.Department).filter(
        models.Department.id == department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail=f"Отдел с ID {department_id} не найден"
        )

    # Проверяем, не конфликтует ли новое название с другими отделами
    if department_update.name != department.name:
        existing_department = db.query(models.Department).filter(
            models.Department.name == department_update.name,
            models.Department.id != department_id
        ).first()
        if existing_department:
            raise HTTPException(
                status_code=400,
                detail=f"Отдел с названием '{department_update.name}' уже существует"
            )

    # Проверяем существование менеджера, если он указан
    if department_update.manager_id:
        manager = db.query(models.User).filter(
            models.User.id == department_update.manager_id
        ).first()
        if not manager:
            raise HTTPException(
                status_code=404,
                detail=f"Пользователь с ID {department_update.manager_id} не найден"
            )
        # Проверяем, что выбранный пользователь имеет роль менеджера
        if manager.role.lower() != "manager":
            raise HTTPException(
                status_code=400,
                detail=f"Пользователь с ID {department_update.manager_id} не является менеджером"
            )

    # Обновляем данные отдела
    department.name = department_update.name
    department.manager_id = department_update.manager_id

    db.commit()
    db.refresh(department)
    return department


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Удаление отдела.
    Только пользователи с ролью HR могут удалять отделы.
    """
    # Проверяем права доступа
    if current_user.role.lower() != "hr":
        raise HTTPException(
            status_code=403,
            detail="Только HR может удалять отделы"
        )

    # Проверяем существование отдела
    department = db.query(models.Department).filter(
        models.Department.id == department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail=f"Отдел с ID {department_id} не найден"
        )

    # Проверяем, есть ли сотрудники в этом отделе
    employees = db.query(models.User).filter(
        models.User.department_id == department_id
    ).all()

    if employees:
        # Обнуляем связи с отделом для всех сотрудников
        for employee in employees:
            employee.department_id = None
            employee.department = None  # Очищаем строковое поле тоже для совместимости

    # Удаляем отдел
    db.delete(department)
    db.commit()

    return None
