# План миграции с SQLite на PostgreSQL в проекте OnboardPro

## Обоснование перехода

SQLite превосходно работал на начальных этапах разработки проекта OnboardPro, обеспечивая простоту настройки и отсутствие необходимости в отдельном сервере базы данных. Однако с ростом проекта возникают ограничения:

### Ограничения SQLite

1. **Конкурентный доступ**: SQLite имеет ограниченную поддержку параллельных операций записи.
2. **Функциональные ограничения**: Отсутствуют многие возможности полноценных СУБД (наследование таблиц, полнотекстовый поиск).
3. **Ограничения миграций**: Некоторые операции (например, изменение типа колонки) требуют пересоздания таблиц.
4. **Масштабируемость**: При росте объема данных и количества пользователей SQLite становится узким местом.

### Преимущества PostgreSQL

1. **Расширенная функциональность**: Полная поддержка SQL, включая сложные запросы, индексы и типы данных.
2. **Конкурентность**: Эффективная работа с множеством параллельных подключений.
3. **Поддержка транзакций и ACID**: Надежное сохранение данных.
4. **Расширяемость**: Возможность вертикального и горизонтального масштабирования.
5. **Управление пользователями**: Детальное управление правами доступа.
6. **Полнотекстовый поиск**: Встроенные механизмы поиска по тексту.

## План миграции

Миграция с SQLite на PostgreSQL должна быть тщательно спланирована для минимизации рисков потери данных и времени простоя системы.

### Фаза 1: Подготовка и анализ

1. **Анализ текущей схемы данных**:

   - Проверка всех моделей SQLAlchemy и их соответствия текущей схеме
   - Выявление особенностей SQLite, которые могут быть несовместимы с PostgreSQL

2. **Создание тестовой среды**:

   - Настройка тестового окружения с PostgreSQL
   - Обновление Docker Compose конфигурации для работы с PostgreSQL

3. **Адаптация кода**:
   - Обновление строки подключения и параметров в `database.py`
   - Замена специфичных для SQLite SQL-запросов на совместимые с PostgreSQL
   - Добавление конфигурационной переменной `DATABASE_TYPE`

### Фаза 2: Миграция схемы и данных

1. **Создание схемы в PostgreSQL**:

   - Использование консолидированной миграции Alembic для создания схемы в PostgreSQL
   - Валидация созданной схемы

2. **Экспорт данных из SQLite**:

   ```python
   # Скрипт для экспорта данных из SQLite в формат JSON или CSV
   import sqlite3
   import json
   import csv

   def export_table_to_json(sqlite_db_path, table_name, output_file):
       conn = sqlite3.connect(sqlite_db_path)
       conn.row_factory = sqlite3.Row
       cursor = conn.cursor()
       cursor.execute(f"SELECT * FROM {table_name}")
       rows = [dict(row) for row in cursor.fetchall()]

       with open(output_file, 'w') as f:
           json.dump(rows, f, indent=2)

       conn.close()
       return len(rows)

   # Экспорт каждой таблицы
   tables = ['users', 'plans', 'task_templates', 'tasks', 'feedback', 'analytics']
   for table in tables:
       count = export_table_to_json('onboardpro.db', table, f'export_{table}.json')
       print(f"Экспортировано {count} записей из таблицы {table}")
   ```

3. **Импорт данных в PostgreSQL**:

   ```python
   # Скрипт для импорта данных из JSON в PostgreSQL
   import json
   import psycopg2

   def import_table_from_json(pg_conn_string, table_name, input_file):
       with open(input_file, 'r') as f:
           data = json.load(f)

       if not data:
           return 0

       conn = psycopg2.connect(pg_conn_string)
       cursor = conn.cursor()

       # Получаем названия колонок
       columns = data[0].keys()
       placeholders = ', '.join(['%s'] * len(columns))
       columns_str = ', '.join(columns)

       # Формируем запрос INSERT
       query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"

       # Подготавливаем значения
       values = [tuple(row[col] for col in columns) for row in data]

       # Выполняем массовую вставку
       cursor.executemany(query, values)
       conn.commit()

       count = len(data)
       cursor.close()
       conn.close()
       return count

   # Импорт каждой таблицы
   pg_conn_string = "postgresql://user:password@postgres:5432/onboardpro"
   tables = ['users', 'plans', 'task_templates', 'tasks', 'feedback', 'analytics']

   for table in tables:
       count = import_table_from_json(pg_conn_string, table, f'export_{table}.json')
       print(f"Импортировано {count} записей в таблицу {table}")
   ```

4. **Проверка данных после импорта**:
   - Сравнение количества записей в каждой таблице
   - Проверка сохранности критических данных
   - Проверка целостности связей между таблицами

### Фаза 3: Переключение и тестирование

1. **Обновление конфигурации**:

   ```python
   # В database.py
   import os

   # Получаем тип базы данных из переменных окружения
   DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite").lower()

   if DATABASE_TYPE == "postgresql":
       PG_USER = os.getenv("POSTGRES_USER", "postgres")
       PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
       PG_HOST = os.getenv("POSTGRES_HOST", "postgres")
       PG_PORT = os.getenv("POSTGRES_PORT", "5432")
       PG_DB = os.getenv("POSTGRES_DB", "onboardpro")
       SQLALCHEMY_DATABASE_URL = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"
   else:
       # SQLite (по умолчанию)
       SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///onboardpro.db")
   ```

2. **Обновление настроек подключения**:

   - Обновление `docker-compose.yml` с добавлением сервиса PostgreSQL
   - Обновление переменных окружения для всех контейнеров

3. **Тестирование системы с PostgreSQL**:
   - Функциональное тестирование всех компонентов системы
   - Стресс-тестирование для проверки производительности
   - Регрессионное тестирование для проверки совместимости

### Фаза 4: Оптимизация для PostgreSQL

1. **Добавление индексов**:

   - Анализ запросов и добавление оптимальных индексов
   - Возможно добавление составных индексов для часто используемых запросов

2. **Другие оптимизации**:
   - Настройка параметров соединения (подключение пула)
   - Оптимизация запросов с учетом особенностей PostgreSQL
   - Включение механизмов кеширования для частых запросов

## Изменения в docker-compose.yml

```yaml
version: "3"

services:
  postgres:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=postgres_password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=onboardpro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
    environment:
      - DATABASE_TYPE=postgresql
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres_password
      - POSTGRES_DB=onboardpro
    command: sh -c "python migration_manager.py migrate && uvicorn main:app --host 0.0.0.0 --reload"

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
```

## График и риски миграции

### График миграции

- **Фаза 1**: 3-5 дней на подготовку и анализ
- **Фаза 2**: 1-2 дня на перенос данных и схемы
- **Фаза 3**: 2-3 дня на тестирование и переключение
- **Фаза 4**: 1-2 недели на оптимизацию (может выполняться после запуска)

### Возможные риски

1. **Потеря данных**: Минимизируется путем создания резервных копий и тщательного тестирования.
2. **Простой системы**: Планировать миграцию в период минимальной активности.
3. **Несовместимость кода**: Некоторый код может быть специфичным для SQLite и потребует адаптации.
4. **Производительность**: Возможно потребуется дополнительная оптимизация запросов.

### Стратегия отката

Если миграция не удалась, должен быть подготовлен план отката к SQLite с минимальной потерей данных:

1. Реверт изменений конфигурации
2. Восстановление базы данных SQLite из резервной копии
3. Откат обновлений кода, специфичных для PostgreSQL

## Требования к ресурсам

### Технические требования

- PostgreSQL 14 или новее
- Дополнительные Python-библиотеки: `psycopg2-binary`
- Настройка сетевой доступности PostgreSQL

### Требования к хранилищу

- Начальный размер базы данных + 20% для индексов
- Дополнительное место для бэкапов и логов

## Заключение

Миграция с SQLite на PostgreSQL позволит проекту OnboardPro получить значительные преимущества в плане масштабируемости, надежности и функциональности. Процесс требует тщательного планирования, но при правильной реализации может быть выполнен с минимальными рисками и времени простоя.

После перехода на PostgreSQL следует продолжать мониторинг производительности системы и оптимизировать запросы и индексы по мере необходимости. Также следует пересмотреть стратегии резервного копирования и восстановления с учетом особенностей PostgreSQL.
