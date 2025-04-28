#!/usr/bin/env python3
"""
Скрипт для проверки соответствия моделей и базы данных SQLite.
Обнаруживает и сообщает о несоответствиях между моделями SQLAlchemy и фактической схемой БД.
"""
import sys
import sqlalchemy as sa
from sqlalchemy.inspection import inspect
from models import Base
from database import engine


def main():
    """
    Проверяет все модели SQLAlchemy на соответствие схеме базы данных.
    """
    inspector = sa.inspect(engine)
    model_errors = []
    tables_to_check = []
    
    # Собираем все модели из Base
    for class_name, model_class in Base._decl_class_registry.items():
        if isinstance(model_class, type) and issubclass(model_class, Base):
            if hasattr(model_class, '__tablename__'):
                tables_to_check.append(model_class)
    
    print(f"Проверка {len(tables_to_check)} моделей на соответствие схеме базы данных...")
    
    for model in tables_to_check:
        table_name = model.__tablename__
        
        # Проверяем, существует ли таблица в БД
        if not inspector.has_table(table_name):
            model_errors.append(f"Таблица '{table_name}' не существует в базе данных")
            continue
        
        db_columns = {col['name']: col for col in inspector.get_columns(table_name)}
        model_columns = {column.name: column for column in model.__table__.columns}
        
        # Проверяем отсутствующие колонки
        for col_name in model_columns:
            if col_name not in db_columns:
                model_errors.append(f"Колонка '{col_name}' определена в модели '{table_name}', но отсутствует в БД")
        
        # Проверяем лишние колонки (опционально)
        for col_name in db_columns:
            if col_name not in model_columns:
                print(f"ВНИМАНИЕ: Колонка '{col_name}' существует в таблице '{table_name}' БД, но не определена в модели")
    
    # Выводим результаты проверки
    if model_errors:
        print("\nОБНАРУЖЕНЫ НЕСООТВЕТСТВИЯ МЕЖДУ МОДЕЛЯМИ И БАЗОЙ ДАННЫХ:")
        for error in model_errors:
            print(f" - {error}")
        print("\nРекомендации:")
        print(" 1. Запустите 'alembic upgrade heads' для применения имеющихся миграций")
        print(" 2. Создайте новую миграцию для недостающих колонок: 'alembic revision --autogenerate -m \"add missing columns\"'")
        print(" 3. Примените новую миграцию: 'alembic upgrade heads'")
        return 1
    else:
        print("✅ Все модели соответствуют схеме базы данных!")
        return 0


if __name__ == '__main__':
    sys.exit(main())
