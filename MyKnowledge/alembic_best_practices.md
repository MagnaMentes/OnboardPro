# Лучшие практики работы с Alembic в OnboardPro

## Введение

Этот документ содержит рекомендации по работе с Alembic для поддержки миграций базы данных в проекте OnboardPro. Следование этим рекомендациям поможет избежать проблем с миграциями, которые были обнаружены и исправлены ранее.

## Общие принципы

1. **Одна миграция — одно изменение**: Каждая миграция должна реализовывать одну логическую единицу изменения схемы базы данных.
2. **Тестирование миграций**: Миграции необходимо тестировать до их применения в production среде.
3. **Описательные названия**: Файлы миграций должны иметь понятные имена, отражающие их содержание.
4. **Документирование сложных миграций**: Если миграция выполняет сложные изменения данных, необходимо добавить комментарии в файл миграции.
5. **Регулярная проверка статуса**: Используйте `alembic current` и `alembic check` для проверки состояния миграций.

## Стандарт именования для миграций

```
ГГГГММДД_ЧЧММ_краткое_описание.py
```

Например:

```
20250510_1430_add_user_role_column.py
```

## Создание новой миграции

Для создания миграции используйте команду:

```bash
docker-compose exec backend alembic revision --autogenerate -m "краткое_описание"
```

**Внимание**: После автогенерации миграции всегда проверяйте её содержимое. Alembic может пропускать некоторые изменения или генерировать неоптимальный код.

## Применение миграций

Для применения всех миграций:

```bash
docker-compose exec backend alembic upgrade head
```

Для применения конкретного количества миграций:

```bash
docker-compose exec backend alembic upgrade +1
```

Для отката миграции:

```bash
docker-compose exec backend alembic downgrade -1
```

## Проверка миграций

Используйте скрипты для проверки целостности миграций:

```bash
docker-compose exec backend python migration_manager.py check
docker-compose exec backend python validate_db_models.py
```

## Стратегия миграции на продакшене

1. **Резервное копирование**: Всегда создавайте резервную копию базы данных перед применением миграций.
2. **Транзакции**: Убедитесь, что миграции выполняются внутри транзакций.
3. **План отката**: Имейте готовый план отката миграции в случае проблем.
4. **Минимизация простоя**: Для критических систем используйте стратегии миграции с минимальным временем простоя.

## Особенности OnboardPro

1. **Формат идентификаторов ревизий**: Используйте только буквенно-цифровой формат (без дефисов).
2. **Работа с миграциями в Docker**: Всегда запускайте команды Alembic из контейнера.
3. **Использование migration_manager.py**: Для регулярной проверки и исправления миграций.

## Процесс консолидации миграций

Если количество миграций становится слишком большим или происходят проблемы с цепочкой миграций, можно использовать скрипт `rebuild_migrations.py`, который создает консолидированную миграцию.

```bash
docker-compose exec backend python rebuild_migrations.py
```

## Миграция с SQLite на PostgreSQL

При переходе с SQLite на PostgreSQL необходимо:

1. Создать полную копию схемы базы данных в PostgreSQL (используя консолидированную миграцию).
2. Экспортировать данные из SQLite в формат, совместимый с PostgreSQL.
3. Импортировать данные в PostgreSQL.
4. Обновить настройки подключения к базе данных в проекте.
5. Обновить все места в коде, где использовались особенности SQLite, для совместимости с PostgreSQL.

## Автоматизация проверки миграций

Рекомендуется добавить проверку миграций в CI/CD pipeline:

1. Добавить шаг для проверки соответствия моделей и схемы базы данных.
2. Добавить шаг для проверки цепочки миграций.
3. Автоматически запускать тесты для проверки работоспособности миграций.

## Проблемы с вопросами-смотрите-здесь

- **Дубликаты ревизий**: Используйте `migration_manager.py` для обнаружения и исправления дубликатов.
- **Неверные down_revision**: Убедитесь, что down_revision указывает на предыдущую миграцию в цепочке.
- **Ошибки автогенерации**: Всегда проверяйте автогенерированные миграции перед их применением.
- **Проблемы с alembic_version**: Используйте `fix_migrations.py` для исправления таблицы alembic_version.
