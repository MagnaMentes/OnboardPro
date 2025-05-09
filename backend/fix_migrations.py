#!/usr/bin/env python3
"""Script to fix migration issues by ensuring all version IDs are consistent."""

import os
import re
from pathlib import Path
from sqlalchemy import create_engine, text

# Путь к директории с миграциями
MIGRATIONS_DIR = Path(__file__).parent / "migrations" / "versions"
# Путь к файлу базы данных
DB_PATH = Path(__file__).parent / "onboardpro.db"


def fix_alembic_versions_table():
    """Fix the alembic_version table in the database."""
    print("Fixing alembic_version table in the database...")

    # Подключаемся к базе данных
    engine = create_engine(f"sqlite:///{DB_PATH}")

    with engine.connect() as conn:
        # Проверяем, существует ли таблица alembic_version
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'"
        ))
        if not result.fetchone():
            print("alembic_version table doesn't exist. Creating...")
            conn.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
            conn.commit()

        # Получаем текущую версию в таблице alembic_version
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        rows = result.fetchall()

        if not rows:
            print("No version in alembic_version table. Adding the latest version...")
            conn.execute(text(
                "INSERT INTO alembic_version (version_num) VALUES ('20250509_1200')"
            ))
            conn.commit()
        else:
            # Если запись существует, но неверная, обновляем её
            current_version = rows[0][0]
            if current_version != '20250509_1200':
                print(
                    f"Updating alembic_version from '{current_version}' to '20250509_1200'")
                conn.execute(text("DELETE FROM alembic_version"))
                conn.execute(text(
                    "INSERT INTO alembic_version (version_num) VALUES ('20250509_1200')"
                ))
                conn.commit()
            else:
                print("alembic_version table has correct version.")


def add_description_column():
    """Add the missing description column to the plans table."""
    print("Adding description column to plans table...")

    engine = create_engine(f"sqlite:///{DB_PATH}")

    with engine.connect() as conn:
        # Проверяем, существует ли таблица plans
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='plans'"
        ))
        if not result.fetchone():
            print("Error: plans table doesn't exist.")
            return False

        # Проверяем, существует ли столбец description
        try:
            result = conn.execute(
                text("SELECT description FROM plans LIMIT 1"))
            print("Column 'description' already exists in plans table.")
            return True
        except Exception:
            print("Column 'description' doesn't exist. Adding...")
            try:
                conn.execute(
                    text("ALTER TABLE plans ADD COLUMN description TEXT"))
                conn.commit()
                print("Successfully added 'description' column to plans table.")
                return True
            except Exception as e:
                print(f"Error adding column: {e}")
                return False


def fix_migration_naming_issue():
    """Исправляет проблемы с несоответствием имен файлов миграций и идентификаторов ревизий."""
    print("Исправление проблем с именами файлов миграций...")

    problematic_file = MIGRATIONS_DIR / \
        "20250426_2112-625fbe5f5d51_create_full_database_schema.py"

    if problematic_file.exists():
        # Меняем идентификатор ревизии в файле на корректный
        with open(problematic_file, 'r') as file:
            content = file.read()

        # Заменяем идентификатор ревизии (убираем дефис)
        new_content = re.sub(
            r'revision: str = \'20250426_2112-625fbe5f5d51\'',
            'revision = \'625fbe5f5d51\'',
            content
        )
        new_content = re.sub(
            r'Revision ID: 20250426_2112-625fbe5f5d51',
            'Revision ID: 625fbe5f5d51',
            new_content
        )

        # Записываем изменения обратно в файл
        with open(problematic_file, 'w') as file:
            file.write(new_content)

        print(f"Исправлен идентификатор ревизии в файле {problematic_file}")

        # Переименовываем файл для соответствия конвенции
        new_file_path = MIGRATIONS_DIR / \
            "20250426_2112_625fbe5f5d51_create_full_database_schema.py"
        if not new_file_path.exists():
            try:
                os.rename(problematic_file, new_file_path)
                print(f"Файл переименован в {new_file_path}")
            except Exception as e:
                print(f"Ошибка при переименовании файла: {e}")
    else:
        print("Проблемный файл не найден, пропускаем.")


if __name__ == "__main__":
    fix_migration_naming_issue()
    fix_alembic_versions_table()
    add_description_column()
    print("Migration fixes completed.")
