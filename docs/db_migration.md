# Миграция с SQLite на PostgreSQL

## Обоснование миграции

SQLite отлично подходит для разработки и тестирования, но для продакшн-среды с высокой нагрузкой имеет существенные ограничения:

1. **Конкурентный доступ**: SQLite не поддерживает одновременную запись из нескольких источников
2. **Масштабирование**: Ограниченные возможности при работе с большими объёмами данных
3. **Отказоустойчивость**: Нет встроенной репликации и механизмов восстановления
4. **Производительность**: Ограниченная оптимизация для сложных запросов

PostgreSQL предлагает решение этих проблем и дополнительные преимущества:

- Полная поддержка ACID-транзакций
- Эффективная работа с конкурентными запросами
- Расширенные возможности индексирования и оптимизации запросов
- Богатый набор типов данных и функций
- Возможности горизонтального и вертикального масштабирования
- Инструменты для обеспечения высокой доступности

## План миграции

### 1. Подготовка среды

#### 1.1. Установка PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (с использованием Homebrew)
brew install postgresql
brew services start postgresql

# Docker
docker pull postgres:16
docker run --name postgres-onboardpro -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres:16
```

#### 1.2. Настройка базы данных

```bash
# Подключение к серверу PostgreSQL
psql -U postgres

# Создание пользователя и базы данных
CREATE USER onboardpro WITH PASSWORD 'your_secure_password';
CREATE DATABASE onboardpro OWNER onboardpro;
GRANT ALL PRIVILEGES ON DATABASE onboardpro TO onboardpro;

# Выход из консоли PostgreSQL
\q
```

#### 1.3. Обновление зависимостей проекта

Добавьте в `requirements.txt`:

```
psycopg2-binary==2.9.9  # PostgreSQL драйвер
```

Выполните установку:

```bash
pip install -r requirements.txt
```

### 2. Адаптация кода проекта

#### 2.1. Обновление настроек подключения к БД (`database.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Получение настроек из переменных окружения с дефолтными значениями
DB_USER = os.getenv("DB_USER", "onboardpro")
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_secure_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "onboardpro")

# Настройки для различных окружений
ENV = os.getenv("ENV", "development")

if ENV == "test":
    # Для тестового окружения используем SQLite в памяти
    SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
elif ENV == "development" and os.getenv("USE_SQLITE", "false").lower() == "true":
    # Опционально можно оставить SQLite для локальной разработки
    SQLALCHEMY_DATABASE_URL = "sqlite:///./onboardpro.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Для продакшена и опционально разработки используем PostgreSQL
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        # Настройки для оптимизации производительности
        pool_size=20,
        max_overflow=40,
        pool_timeout=30,
        pool_recycle=1800,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Функция для получения соединения с БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 2.2. Адаптация моделей данных (`models.py`)

Необходимые изменения:

1. Используем PostgreSQL-специфичные типы данных
2. Адаптируем индексы с учетом возможностей PostgreSQL
3. Оптимизируем производительность с учетом особенностей PostgreSQL

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy import Index, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base, relationship
import uuid

Base = declarative_base()

# Пример адаптации модели для PostgreSQL
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    middle_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(String(50), default="employee")
    department = Column(String(100), nullable=True, index=True)
    telegram_id = Column(String(100), nullable=True)
    disabled = Column(Boolean, default=False)
    photo = Column(String(255), nullable=True)

    # Используем UUID для идентификатора сессии (опционально)
    session_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=True)

    # Метки времени с использованием серверного времени PostgreSQL
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Отношения
    tasks = relationship("Task", back_populates="assignee")
    sent_feedback = relationship("Feedback", back_populates="sender", foreign_keys="[Feedback.sender_id]")
    received_feedback = relationship("Feedback", back_populates="recipient", foreign_keys="[Feedback.recipient_id]")

    # PostgreSQL-специфичные индексы
    __table_args__ = (
        Index('ix_users_email_lower', text('lower(email)')),  # Индексирование с учетом регистра
        Index('ix_users_role_department', 'role', 'department'),  # Составной индекс
    )


# Пример адаптации модели Task с оптимизациями для PostgreSQL
class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    template_id = Column(Integer, ForeignKey("task_templates.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(50), nullable=False, index=True)
    deadline = Column(DateTime, nullable=False, index=True)
    status = Column(String(50), default="pending", index=True)

    # Дополнительные метаданные в JSON формате (преимущество PostgreSQL)
    metadata = Column(JSONB, nullable=True)

    # Метки времени
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)

    # Отношения
    assignee = relationship("User", back_populates="tasks", lazy="joined")
    template = relationship("TaskTemplate", back_populates="tasks", lazy="joined")

    # Оптимизированные индексы для PostgreSQL
    __table_args__ = (
        Index('ix_tasks_plan_status_deadline', 'plan_id', 'status', 'deadline'),
        Index('ix_tasks_user_status', 'user_id', 'status'),
        # GIN-индекс для эффективного поиска по JSONB-полю
        Index('ix_tasks_metadata', metadata, postgresql_using='gin'),
    )
```

### 3. Миграция данных

#### 3.1. Подготовка и консолидация миграций

Перед переходом на PostgreSQL рекомендуется консолидировать все миграции и убедиться в их целостности:

```bash
# Запустите скрипт для консолидации миграций
python rebuild_migrations.py

# Проверьте целостность новой структуры миграций
python test_migrations.py

# Проверьте корректность миграций с помощью менеджера миграций
python migration_manager.py check
```

#### 3.2. Создание схемы БД в PostgreSQL

Используем консолидированные миграции для создания схемы базы данных:

```bash
# Установите переменные окружения для подключения к PostgreSQL
export ENV=development
export USE_SQLITE=false
export DB_USER=onboardpro
export DB_PASSWORD=your_secure_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=onboardpro

# Создайте резервную копию текущей базы данных
python migration_manager.py backup

# Применение миграции
alembic upgrade head

# Проверьте соответствие схемы моделям
python test_migrations.py --check-schema-only
```

#### 3.2. Экспорт данных из SQLite

Создайте скрипт `migrate_data.py`:

```python
import os
import sqlite3
import psycopg2
import json
from datetime import datetime
from psycopg2.extras import RealDictCursor

# Конфигурация
SQLITE_DB_PATH = "onboardpro.db"
PG_CONNECTION = {
    "dbname": os.getenv("DB_NAME", "onboardpro"),
    "user": os.getenv("DB_USER", "onboardpro"),
    "password": os.getenv("DB_PASSWORD", "your_secure_password"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

# Таблицы для миграции (в порядке зависимостей)
TABLES = [
    "users",
    "plans",
    "task_templates",
    "tasks",
    "feedback",
    "analytics",
]

def sqlite_to_pg_datetime(sqlite_date):
    """Конвертирует формат даты SQLite в формат PostgreSQL"""
    if not sqlite_date:
        return None
    try:
        dt = datetime.fromisoformat(sqlite_date)
        return dt.isoformat()
    except (ValueError, TypeError):
        return None

def migrate_table(table_name, sqlite_conn, pg_conn):
    """Мигрирует данные одной таблицы из SQLite в PostgreSQL"""
    print(f"Миграция таблицы {table_name}...")

    # Получаем все записи из SQLite
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()

    # Получаем имена колонок
    columns = [description[0] for description in sqlite_cursor.description]

    # Если нет данных, пропускаем таблицу
    if not rows:
        print(f"  Таблица {table_name} пуста, пропускаем")
        return

    # Подготавливаем данные для вставки в PostgreSQL
    pg_cursor = pg_conn.cursor()
    for row in rows:
        # Создаем словарь с данными
        data = dict(zip(columns, row))

        # Обрабатываем даты для PostgreSQL
        for key, value in data.items():
            if isinstance(value, str) and 'T' in value and '+' in value:
                data[key] = sqlite_to_pg_datetime(value)

        # Создаем SQL запрос для вставки
        columns_str = ", ".join(data.keys())
        placeholders = ", ".join([f"%({col})s" for col in data.keys()])

        # Выполняем вставку в PostgreSQL
        try:
            pg_cursor.execute(
                f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})",
                data
            )
        except Exception as e:
            print(f"  Ошибка при вставке в {table_name}: {e}")
            pg_conn.rollback()
            # Для отладки
            print(f"  Данные: {data}")
            raise

    # Обновляем автоинкремент для PostgreSQL
    try:
        pg_cursor.execute(f"SELECT setval('{table_name}_id_seq', (SELECT MAX(id) FROM {table_name}))")
    except Exception as e:
        print(f"  Предупреждение: не удалось обновить последовательность для {table_name}: {e}")

    # Фиксируем изменения
    pg_conn.commit()
    print(f"  Таблица {table_name} успешно мигрирована")

def main():
    """Основная функция миграции"""
    print("Начинаем миграцию данных из SQLite в PostgreSQL")

    # Подключение к SQLite
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row

    # Подключение к PostgreSQL
    pg_conn = psycopg2.connect(**PG_CONNECTION, cursor_factory=RealDictCursor)

    try:
        # Мигрируем каждую таблицу
        for table in TABLES:
            migrate_table(table, sqlite_conn, pg_conn)

        print("Миграция данных успешно завершена")
    except Exception as e:
        print(f"Ошибка при миграции: {e}")
    finally:
        # Закрываем соединения
        sqlite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    main()
```

Запустите скрипт миграции данных:

```bash
python migrate_data.py
```

### 4. Проверка и валидация

#### 4.1. Скрипт проверки целостности данных

```python
import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor

# Конфигурация
SQLITE_DB_PATH = "onboardpro.db"
PG_CONNECTION = {
    "dbname": os.getenv("DB_NAME", "onboardpro"),
    "user": os.getenv("DB_USER", "onboardpro"),
    "password": os.getenv("DB_PASSWORD", "your_secure_password"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

# Таблицы для проверки
TABLES = ["users", "plans", "task_templates", "tasks", "feedback", "analytics"]

def validate_migration():
    """Проверяет соответствие данных между SQLite и PostgreSQL"""
    print("Проверка корректности миграции...")

    # Подключение к SQLite
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row

    # Подключение к PostgreSQL
    pg_conn = psycopg2.connect(**PG_CONNECTION, cursor_factory=RealDictCursor)

    success = True
    try:
        sqlite_cursor = sqlite_conn.cursor()
        pg_cursor = pg_conn.cursor()

        # Проверяем каждую таблицу
        for table in TABLES:
            print(f"Проверка таблицы {table}...")

            # Количество записей
            sqlite_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            sqlite_count = sqlite_cursor.fetchone()[0]

            pg_cursor.execute(f"SELECT COUNT(*) FROM {table}")
            pg_count = pg_cursor.fetchone()['count']

            if sqlite_count == pg_count:
                print(f"  ✓ Количество записей совпадает: {sqlite_count}")
            else:
                print(f"  ✗ Количество записей не совпадает: SQLite={sqlite_count}, PostgreSQL={pg_count}")
                success = False

            # Проверка содержимого (по ID)
            if sqlite_count > 0:
                # Берем несколько записей для сравнения
                sqlite_cursor.execute(f"SELECT * FROM {table} ORDER BY id LIMIT 5")
                sqlite_sample = sqlite_cursor.fetchall()

                for row in sqlite_sample:
                    row_id = row[0]  # Предполагаем, что ID - первая колонка
                    pg_cursor.execute(f"SELECT * FROM {table} WHERE id = %s", (row_id,))
                    pg_row = pg_cursor.fetchone()

                    if not pg_row:
                        print(f"  ✗ Запись с ID={row_id} отсутствует в PostgreSQL")
                        success = False
                        continue

                    # Проверяем основные атрибуты (это упрощенная проверка)
                    # В реальном сценарии нужна более детальная проверка полей
                    if len(row) != len(pg_row):
                        print(f"  ✗ Различное количество полей для ID={row_id}")
                        success = False

            print(f"  {'✓' if success else '✗'} Проверка таблицы {table} {'успешна' if success else 'не удалась'}")

    except Exception as e:
        print(f"Ошибка при проверке: {e}")
        success = False
    finally:
        sqlite_conn.close()
        pg_conn.close()

    return success

if __name__ == "__main__":
    result = validate_migration()
    if result:
        print("\nМиграция выполнена успешно! Данные соответствуют.")
    else:
        print("\nПри миграции возникли проблемы. Проверьте лог и исправьте несоответствия.")
```

Запустите скрипт проверки:

```bash
python validate_migration.py
```

#### 4.2. Тестирование приложения с новой БД

```bash
# Установка переменных окружения для PostgreSQL
export ENV=test
export USE_SQLITE=false
export DB_USER=onboardpro
export DB_PASSWORD=your_secure_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=onboardpro_test

# Запуск тестов
python -m pytest tests/
```

### 5. Переход на PostgreSQL в продакшене

#### 5.1. Обновление Docker Compose

Обновите файл `docker-compose.yml`:

```yaml
version: "3.8"

services:
  db:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - ./.env
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_DB=${DB_NAME}
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - ./.env
    environment:
      - ENV=production
      - USE_SQLITE=false
      - DB_HOST=db
      - DB_PORT=5432
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend

  nginx:
    image: nginx:1.25
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
```

#### 5.2. Создание файла с переменными окружения

Создайте файл `.env`:

```
# Настройки базы данных
DB_USER=onboardpro
DB_PASSWORD=your_secure_password
DB_NAME=onboardpro
DB_HOST=db
DB_PORT=5432

# Настройки приложения
ENV=production
USE_SQLITE=false
SECRET_KEY=your_secret_key_here
```

#### 5.3. Развертывание обновленной инфраструктуры

```bash
# Сохранение резервной копии текущей БД SQLite
cp backend/onboardpro.db backend/onboardpro.db.backup

# Запуск с новой конфигурацией
docker-compose up -d
```

### 6. План отката

В случае проблем с PostgreSQL можно быстро откатиться к SQLite:

1. Обновите `.env`:

   ```
   USE_SQLITE=true
   ```

2. Восстановите резервную копию SQLite:

   ```bash
   cp backend/onboardpro.db.backup backend/onboardpro.db
   ```

3. Перезапустите контейнеры:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### 7. Оптимизация PostgreSQL

#### 7.1. Базовые настройки для повышения производительности

Файл `/etc/postgresql/16/main/postgresql.conf` (или соответствующий файл конфигурации):

```
# Основные настройки
max_connections = 100
shared_buffers = 1GB  # 25% от оперативной памяти
effective_cache_size = 3GB  # 75% от оперативной памяти
maintenance_work_mem = 256MB
work_mem = 16MB
wal_buffers = 16MB

# Настройки журнала
checkpoint_completion_target = 0.9
default_statistics_target = 100

# Планировщик
random_page_cost = 1.1  # для SSD
effective_io_concurrency = 200  # для SSD

# Параллелизм (если доступно несколько ядер)
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
```

#### 7.2. Индексация и оптимизация запросов

1. Регулярно выполняйте `VACUUM ANALYZE` для обновления статистики

2. Используйте объясненные планы запросов для оптимизации:

   ```sql
   EXPLAIN ANALYZE SELECT * FROM tasks WHERE status = 'pending' AND deadline < now();
   ```

3. Для больших таблиц создавайте индексы с частичным охватом:

   ```sql
   CREATE INDEX idx_tasks_pending ON tasks (deadline) WHERE status = 'pending';
   ```

4. При работе с большими объемами текстовых данных используйте полнотекстовый поиск:

   ```sql
   ALTER TABLE tasks ADD COLUMN description_ts tsvector
     GENERATED ALWAYS AS (to_tsvector('russian', description)) STORED;

   CREATE INDEX idx_tasks_fts ON tasks USING GIN (description_ts);
   ```

5. Для аналитических запросов используйте материализованные представления:

   ```sql
   CREATE MATERIALIZED VIEW task_stats AS
     SELECT
       date_trunc('day', created_at) as day,
       status,
       count(*)
     FROM tasks
     GROUP BY 1, 2;

   CREATE UNIQUE INDEX ON task_stats (day, status);
   ```

#### 7.3. Мониторинг производительности

1. Настройте и регулярно проверяйте логи медленных запросов:

   ```
   log_min_duration_statement = 200  # мс
   ```

2. Используйте расширение `pg_stat_statements` для анализа производительности запросов:

   ```sql
   CREATE EXTENSION pg_stat_statements;

   -- Просмотр самых медленных запросов
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

3. Настройте мониторинг системы с использованием Prometheus и Grafana для отслеживания:
   - Использования CPU и RAM
   - Времени отклика БД
   - Количества подключений
   - IOPS и задержек дисковой подсистемы

## Заключение

Миграция с SQLite на PostgreSQL значительно повысит производительность, надежность и масштабируемость приложения OnboardPro. Следуя этому руководству, вы сможете выполнить миграцию с минимальным временем простоя и рисками.

После миграции рекомендуется:

1. Настроить регулярное резервное копирование PostgreSQL
2. Мониторить производительность базы данных
3. Регулярно проводить обслуживание базы данных (VACUUM, ANALYZE)
4. Оптимизировать индексы и запросы на основе реальных нагрузок
