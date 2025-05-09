
@app.get("/users/departments")
async def get_departments(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(auth.get_db)
):
    """
    Получение списка всех отделов в системе. 
    Возвращает уникальные значения поля department из таблицы users.
    """
    # Проверяем права доступа (только HR и менеджеры могут просматривать отделы)
    if current_user.role.lower() not in ["hr", "manager"]:
        raise HTTPException(
            status_code=403,
            detail="Только HR или менеджеры могут просматривать список отделов"
        )
    
    # Используем SQL функцию distinct для получения уникальных значений поля department
    departments = [
        dept[0] for dept in 
        db.query(distinct(models.User.department))
        .filter(models.User.department != None)
        .filter(models.User.department != "")
        .order_by(models.User.department)
        .all()
    ]
    
    return {"departments": departments}

