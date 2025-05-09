#!/usr/bin/env python3
"""
Скрипт для полного восстановления цепочки миграций Alembic.
Создает консолидированную миграцию с текущим состоянием схемы БД.
"""

import os
import datetime
import shutil
import re
import subprocess
from pathlib import Path
from sqlalchemy import create_engine, text

# Путь к директории с миграциями
MIGRATIONS_DIR = Path(__file__).parent / "migrations" / "versions"
BACKUP_DIR = Path(__file__).parent / "migrations" / "versions_backup"
DB_PATH = Path(__file__).parent / "onboardpro.db"

# Создаем директорию для резервных копий, если её нет
BACKUP_DIR.mkdir(exist_ok=True)


def backup_migrations():
    """Создание резервной копии файлов миграций."""
    print("Создание резервных копий миграций...")

    # Очищаем директорию с бэкапами, если она не пуста
    if list(BACKUP_DIR.glob("*")):
        for file in BACKUP_DIR.glob("*"):
            file.unlink()

    # Копируем текущие миграции в директорию с бэкапами
    for file in MIGRATIONS_DIR.glob("*.py"):
        shutil.copy(file, BACKUP_DIR / file.name)

    print(f"Резервные копии созданы в {BACKUP_DIR}")


def clear_migrations():
    """Удаление всех файлов миграций из директории versions."""
    print("Удаление старых файлов миграций...")

    for file in MIGRATIONS_DIR.glob("*.py"):
        file.unlink()

    print("Старые файлы миграций удалены.")


def create_consolidated_migration():
    """Создание новой консолидированной миграции на основе текущей схемы БД."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
    migration_file = MIGRATIONS_DIR / f"{timestamp}_consolidated_schema.py"

    print(f"Создание новой консолидированной миграции: {migration_file}")

    # Код, соответствующий текущей схеме базы данных
    migration_content = f"""\"\"\"Consolidated schema

Revision ID: {timestamp}_consolidated
Revises: 
Create Date: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

\"\"\"
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '{timestamp}_consolidated'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    \"\"\"Create complete schema from scratch.\"\"\"
    # Пользователи
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password', sa.String(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=True),
        sa.Column('last_name', sa.String(), nullable=True),
        sa.Column('middle_name', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('telegram_id', sa.String(), nullable=True),
        sa.Column('disabled', sa.Boolean(), nullable=True),
        sa.Column('photo', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_department'), 'users', ['department'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_created_at'), 'users', ['created_at'], unique=False)
    
    # Планы онбординга
    op.create_table('plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('department', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('duration_days', sa.Integer(), nullable=True),
        sa.Column('target_role', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_plans_department'), 'plans', ['department'], unique=False)
    op.create_index(op.f('ix_plans_target_role'), 'plans', ['target_role'], unique=False)
    
    # Шаблоны задач
    op.create_table('task_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(), nullable=False),
        sa.Column('duration_days', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_task_templates_department'), 'task_templates', ['department'], unique=False)
    op.create_index(op.f('ix_task_templates_priority'), 'task_templates', ['priority'], unique=False)
    op.create_index(op.f('ix_task_templates_role'), 'task_templates', ['role'], unique=False)
    op.create_index(op.f('ix_task_templates_role_department'), 'task_templates', ['role', 'department'], unique=False)
    
    # Задачи
    op.create_table('tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('plan_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(), nullable=False),
        sa.Column('deadline', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['plans.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['task_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_plan_id'), 'tasks', ['plan_id'], unique=False)
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)
    op.create_index(op.f('ix_tasks_template_id'), 'tasks', ['template_id'], unique=False)
    op.create_index(op.f('ix_tasks_deadline'), 'tasks', ['deadline'], unique=False)
    op.create_index(op.f('ix_tasks_priority'), 'tasks', ['priority'], unique=False)
    op.create_index(op.f('ix_tasks_status'), 'tasks', ['status'], unique=False)
    op.create_index('ix_tasks_plan_status_deadline', 'tasks', ['plan_id', 'status', 'deadline'], unique=False)
    
    # Обратная связь
    op.create_table('feedback',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=True),
        sa.Column('recipient_id', sa.Integer(), nullable=True),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('rating', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Аналитика
    op.create_table('analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('metric', sa.String(), nullable=True),
        sa.Column('value', sa.Float(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    \"\"\"Drop all tables.\"\"\"
    op.drop_table('analytics')
    op.drop_table('feedback')
    op.drop_index('ix_tasks_plan_status_deadline', table_name='tasks')
    op.drop_index(op.f('ix_tasks_status'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_priority'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_deadline'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_template_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_plan_id'), table_name='tasks')
    op.drop_table('tasks')
    op.drop_index(op.f('ix_task_templates_role_department'), table_name='task_templates')
    op.drop_index(op.f('ix_task_templates_role'), table_name='task_templates')
    op.drop_index(op.f('ix_task_templates_priority'), table_name='task_templates')
    op.drop_index(op.f('ix_task_templates_department'), table_name='task_templates')
    op.drop_table('task_templates')
    op.drop_index(op.f('ix_plans_target_role'), table_name='plans')
    op.drop_index(op.f('ix_plans_department'), table_name='plans')
    op.drop_table('plans')
    op.drop_index(op.f('ix_users_created_at'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_department'), table_name='users')
    op.drop_table('users')
"""

    with open(migration_file, "w") as f:
        f.write(migration_content)

    print(f"Миграция создана: {migration_file}")

    return f"{timestamp}_consolidated"


def update_alembic_version_table(revision):
    """Обновление таблицы alembic_version в БД."""
    print("Обновление таблицы alembic_version в БД...")

    engine = create_engine(f"sqlite:///{DB_PATH}")

    with engine.connect() as conn:
        # Проверяем, существует ли таблица alembic_version
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'"
        ))
        if not result.fetchone():
            print("Таблица alembic_version не существует, создаем...")
            conn.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
        else:
            # Удаляем существующие записи
            conn.execute(text("DELETE FROM alembic_version"))

        # Вставляем новую запись
        conn.execute(
            text(f"INSERT INTO alembic_version (version_num) VALUES ('{revision}')"))
        conn.commit()

    print(f"Таблица alembic_version обновлена до ревизии {revision}")


def validate_database_schema():
    """Валидация схемы БД после восстановления."""
    print("Валидация схемы БД...")

    result = subprocess.run(
        ["python", "validate_db_models.py"], capture_output=True, text=True)

    if result.returncode == 0:
        print("Валидация схемы базы данных успешна.")
        return True
    else:
        print("Ошибка при валидации схемы базы данных:")
        print(result.stdout)
        print(result.stderr)
        return False


if __name__ == "__main__":
    try:
        # 1. Создаем резервную копию миграций
        backup_migrations()

        # 2. Удаляем текущие миграции
        clear_migrations()

        # 3. Создаем новую консолидированную миграцию
        revision = create_consolidated_migration()

        # 4. Обновляем таблицу alembic_version
        update_alembic_version_table(f"{revision}")

        # 5. Валидируем схему БД
        validate_database_schema()

        print("\nУспешно выполнено восстановление миграций.")
        print(f"Новая консолидированная миграция: {revision}")
        print("Файлы резервных копий сохранены в директории migrations/versions_backup.")
    except Exception as e:
        print(f"Ошибка при восстановлении миграций: {e}")
        print("Возможно, потребуется восстановление из резервных копий.")
