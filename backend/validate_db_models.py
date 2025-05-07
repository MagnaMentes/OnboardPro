#!/usr/bin/env python3
"""
Скрипт для проверки моделей БД перед запуском API.

Этот скрипт проверяет соответствие моделей SQLAlchemy и фактической схемы базы данных,
обнаруживает несоответствия и выводит четкие сообщения об ошибках.

Его можно запускать как при запуске приложения (для превентивного обнаружения проблем),
так и вручную при необходимости проверки.
"""

import models
import sys
import logging
import os
from pathlib import Path
from typing import Dict, List, Set, Any, Tuple

from sqlalchemy import create_engine, MetaData, inspect, Column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Импортируем модели, чтобы получить доступ к их метаданным
sys.path.insert(0, str(Path(__file__).parent))

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("validate_db_models")

# Переменные окружения для конфигурации БД
ENV = os.getenv("ENV", "development")
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"
DB_USER = os.getenv("DB_USER", "onboardpro")
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_secure_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "onboardpro")


def get_db_url() -> str:
    """Получение URL базы данных на основе окружения."""
    if ENV == "test":
        return "sqlite:///:memory:"
    elif USE_SQLITE:
        return f"sqlite:///{Path(__file__).parent}/onboardpro.db"
    else:
        return f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


def get_model_tables() -> Dict[str, Any]:
    """
    Получение информации о таблицах из моделей SQLAlchemy.

    Returns:
        Dict[str, Any]: словарь с информацией о таблицах из моделей
    """
    base = models.Base
    return {
        table_name: {
            "columns": {c.name: c for c in table.columns},
            "primary_key": [c.name for c in table.primary_key.columns],
            "foreign_keys": [
                {
                    "column": fk.parent.name,
                    "target_table": fk.column.table.name,
                    "target_column": fk.column.name
                }
                for fk in table.foreign_keys
            ],
            "indexes": [
                {
                    "name": idx.name,
                    "columns": [c.name for c in idx.columns]
                }
                for idx in table.indexes
            ]
        }
        for table_name, table in base.metadata.tables.items()
    }


def get_database_tables(engine) -> Dict[str, Any]:
    """
    Получение информации о таблицах из реальной базы данных.

    Args:
        engine: SQLAlchemy engine подключения к БД

    Returns:
        Dict[str, Any]: словарь с информацией о таблицах из БД
    """
    metadata = MetaData()
    metadata.reflect(bind=engine)
    inspector = inspect(engine)

    result = {}

    for table_name in metadata.tables:
        table = metadata.tables[table_name]

        # Получаем информацию о первичном ключе
        pk_constraint = inspector.get_pk_constraint(table_name)
        primary_keys = pk_constraint.get(
            'constrained_columns', []) if pk_constraint else []

        # Получаем информацию о внешних ключах
        fk_list = []
        for fk in inspector.get_foreign_keys(table_name):
            fk_list.append({
                "column": fk.get('constrained_columns', [''])[0],
                "target_table": fk.get('referred_table', ''),
                "target_column": fk.get('referred_columns', [''])[0]
            })

        # Получаем информацию об индексах
        indexes = []
        for idx in inspector.get_indexes(table_name):
            indexes.append({
                "name": idx.get('name', ''),
                "columns": idx.get('column_names', [])
            })

        # Информация о колонках
        columns = {}
        for column in inspector.get_columns(table_name):
            columns[column['name']] = column

        result[table_name] = {
            "columns": columns,
            "primary_key": primary_keys,
            "foreign_keys": fk_list,
            "indexes": indexes
        }

    return result


def compare_tables(model_tables: Dict[str, Any], db_tables: Dict[str, Any]) -> Dict[str, Any]:
    """
    Сравнивает схему из моделей со схемой БД и возвращает отчет о расхождениях.

    Args:
        model_tables: словарь с информацией о таблицах из моделей
        db_tables: словарь с информацией о таблицах из БД

    Returns:
        Dict[str, Any]: отчет о расхождениях
    """
    report = {
        "missing_tables": [],
        "unexpected_tables": [],
        "table_issues": {}
    }

    # Проверка на отсутствующие и неожиданные таблицы
    model_table_names = set(model_tables.keys())
    db_table_names = set(db_tables.keys())

    missing_tables = model_table_names - db_table_names
    unexpected_tables = db_table_names - model_table_names - \
        {"alembic_version", "sqlite_sequence"}

    if missing_tables:
        report["missing_tables"] = list(missing_tables)

    if unexpected_tables:
        report["unexpected_tables"] = list(unexpected_tables)

    # Проверка соответствия таблиц
    for table_name in model_table_names & db_table_names:
        model_table = model_tables[table_name]
        db_table = db_tables[table_name]
        table_report = {}

        # Проверка колонок
        model_columns = set(model_table["columns"].keys())
        db_columns = set(db_table["columns"].keys())

        missing_columns = model_columns - db_columns
        unexpected_columns = db_columns - model_columns

        if missing_columns:
            table_report["missing_columns"] = list(missing_columns)

        if unexpected_columns:
            table_report["unexpected_columns"] = list(unexpected_columns)

        # Проверка первичных ключей
        model_pk = set(model_table["primary_key"])
        db_pk = set(db_table["primary_key"])

        if model_pk != db_pk:
            table_report["primary_key_mismatch"] = {
                "expected": list(model_pk),
                "actual": list(db_pk)
            }

        # Проверка внешних ключей
        # Упрощенная проверка - просто подсчет количества FK
        if len(model_table["foreign_keys"]) != len(db_table["foreign_keys"]):
            table_report["foreign_key_count_mismatch"] = {
                "expected": len(model_table["foreign_keys"]),
                "actual": len(db_table["foreign_keys"])
            }

        if table_report:
            report["table_issues"][table_name] = table_report

    return report


def validate_db_schema() -> Tuple[bool, Dict[str, Any]]:
    """
    Проверяет соответствие моделей SQLAlchemy и схемы базы данных.

    Returns:
        Tuple[bool, Dict[str, Any]]: флаг успеха и отчет о проверке
    """
    try:
        # Подключаемся к БД
        engine = create_engine(get_db_url())

        # Получаем информацию о таблицах
        model_tables = get_model_tables()
        db_tables = get_database_tables(engine)

        # Сравниваем информацию
        report = compare_tables(model_tables, db_tables)

        # Определяем, есть ли критические проблемы
        has_critical_issues = bool(
            report.get("missing_tables") or
            any("missing_columns" in issues for issues in report.get(
                "table_issues", {}).values())
        )

        # Добавляем сводную информацию
        report["has_critical_issues"] = has_critical_issues
        report["validated_at"] = None  # будет заполнено при сохранении отчета

        return not has_critical_issues, report

    except Exception as e:
        logger.error(f"Ошибка при проверке схемы БД: {e}")
        return False, {"error": str(e)}


def print_report(report: Dict[str, Any]) -> None:
    """
    Выводит отчет о проверке схемы БД в консоль.

    Args:
        report: отчет о проверке
    """
    if "error" in report:
        print(f"\n❌ ОШИБКА: {report['error']}")
        return

    print("\n=== Отчет о проверке схемы БД ===")
    print("-" * 80)

    if report.get("missing_tables"):
        print("❌ ОТСУТСТВУЮЩИЕ ТАБЛИЦЫ:")
        for table in report["missing_tables"]:
            print(f"  - {table}")
        print("")

    if report.get("unexpected_tables"):
        print("⚠️ НЕОЖИДАННЫЕ ТАБЛИЦЫ:")
        for table in report["unexpected_tables"]:
            print(f"  - {table}")
        print("")

    if report.get("table_issues"):
        print("❓ ПРОБЛЕМЫ В ТАБЛИЦАХ:")
        for table, issues in report["table_issues"].items():
            print(f"  📋 {table}:")

            if "missing_columns" in issues:
                print("    ❌ Отсутствующие колонки:")
                for column in issues["missing_columns"]:
                    print(f"      - {column}")

            if "unexpected_columns" in issues:
                print("    ⚠️ Неожиданные колонки:")
                for column in issues["unexpected_columns"]:
                    print(f"      - {column}")

            if "primary_key_mismatch" in issues:
                pk_info = issues["primary_key_mismatch"]
                print("    ❌ Несоответствие первичного ключа:")
                print(f"      Ожидалось: {', '.join(pk_info['expected'])}")
                print(f"      Фактически: {', '.join(pk_info['actual'])}")

            if "foreign_key_count_mismatch" in issues:
                fk_info = issues["foreign_key_count_mismatch"]
                print("    ⚠️ Несоответствие количества внешних ключей:")
                print(f"      Ожидалось: {fk_info['expected']}")
                print(f"      Фактически: {fk_info['actual']}")

            print("")

    if not report.get("missing_tables") and not report.get("table_issues"):
        print("✅ Схема базы данных соответствует моделям SQLAlchemy!")

    print("-" * 80)
    print(f"{'❌' if report['has_critical_issues'] else '✅'} Итог: {'Есть критические проблемы' if report['has_critical_issues'] else 'Проблем не обнаружено'}")
    print("-" * 80)


def main() -> int:
    """
    Основная функция для запуска проверки схемы БД.

    Returns:
        int: код завершения (0 - успех, 1 - ошибка)
    """
    logger.info("Начинаем проверку схемы базы данных...")
    success, report = validate_db_schema()

    print_report(report)

    if not success:
        logger.error("Проверка схемы базы данных не пройдена!")
        return 1

    logger.info("Проверка схемы базы данных успешно завершена")
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
