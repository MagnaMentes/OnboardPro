"""add department_id to users

Revision ID: add_department_id_to_users
Revises: a793c68bd92f
Create Date: 2024-05-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_department_id_to_users'
down_revision = 'a793c68bd92f'
branch_labels = None
depends_on = None


def upgrade():
    # Добавляем колонку department_id в таблицу users, если её ещё нет
    op.execute("""
        PRAGMA foreign_keys=off;
        
        BEGIN TRANSACTION;
        
        -- Проверяем, существует ли уже колонка department_id
        -- SQLite не поддерживает IF NOT EXISTS для ALTER TABLE ADD COLUMN
        CREATE TABLE IF NOT EXISTS users_new (
            id INTEGER PRIMARY KEY,
            email VARCHAR NOT NULL,
            password VARCHAR NOT NULL,
            first_name VARCHAR,
            last_name VARCHAR, 
            middle_name VARCHAR,
            phone VARCHAR,
            role VARCHAR DEFAULT 'employee',
            department VARCHAR,
            department_id INTEGER,
            telegram_id VARCHAR,
            disabled BOOLEAN DEFAULT FALSE,
            photo VARCHAR,
            FOREIGN KEY(department_id) REFERENCES departments(id)
        );
        
        -- Копируем данные из старой таблицы
        INSERT INTO users_new SELECT 
            id, 
            email, 
            password, 
            first_name, 
            last_name, 
            middle_name, 
            phone, 
            role, 
            department, 
            NULL as department_id, 
            telegram_id, 
            disabled, 
            photo
        FROM users;
        
        -- Удаляем старую таблицу и переименовываем новую
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        
        -- Создаем необходимые индексы
        CREATE UNIQUE INDEX ix_users_email ON users (email);
        CREATE INDEX ix_users_id ON users (id);
        CREATE INDEX ix_users_department ON users (department);
        CREATE INDEX ix_users_department_id ON users (department_id);
        
        COMMIT;
        
        PRAGMA foreign_keys=on;
    """)


def downgrade():
    # Удаляем колонку department_id из таблицы users
    # SQLite не поддерживает удаление столбцов,
    # поэтому создаем новую таблицу без столбца department_id
    op.execute("""
        PRAGMA foreign_keys=off;
        
        BEGIN TRANSACTION;
        
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY,
            email VARCHAR NOT NULL,
            password VARCHAR NOT NULL,
            first_name VARCHAR,
            last_name VARCHAR, 
            middle_name VARCHAR,
            phone VARCHAR,
            role VARCHAR DEFAULT 'employee',
            department VARCHAR,
            telegram_id VARCHAR,
            disabled BOOLEAN DEFAULT FALSE,
            photo VARCHAR
        );
        
        -- Копируем данные из старой таблицы
        INSERT INTO users_new SELECT 
            id, 
            email, 
            password, 
            first_name, 
            last_name, 
            middle_name, 
            phone, 
            role, 
            department, 
            telegram_id, 
            disabled, 
            photo
        FROM users;
        
        -- Удаляем старую таблицу и переименовываем новую
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        
        -- Создаем необходимые индексы
        CREATE UNIQUE INDEX ix_users_email ON users (email);
        CREATE INDEX ix_users_id ON users (id);
        CREATE INDEX ix_users_department ON users (department);
        
        COMMIT;
        
        PRAGMA foreign_keys=on;
    """)
