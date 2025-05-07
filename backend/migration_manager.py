#!/usr/bin/env python3
"""
Скрипт комплексного управления миграциями для проекта OnboardPro.

Функциональность:
- Автоматическое определение СУБД (SQLite или PostgreSQL)
- Проверка и восстановление целостности миграций
- Автоматическая проверка схемы базы данных
- Возможность выполнения миграций в Docker-среде
- Создание отчетов о состоянии миграций
- Безопасное переключение между СУБД

Использование:
    python migration_manager.py check - Проверка состояния миграций
    python migration_manager.py fix - Исправление проблем с миграциями
    python migration_manager.py report - Создание отчета о миграциях
    python migration_manager.py upgrade [--revision REVISION] - Применение миграций (до указанной версии)
    python migration_manager.py create "описание изменения" - Создание новой миграции
    python migration_manager.py history - Показать историю миграций
"""

import os
import sys
import re
import logging
import argparse
import datetime
import json
from pathlib import Path
from typing import Optional, Dict, List, Tuple, Any, Union

from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, String
from sqlalchemy.orm import sessionmaker
from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("migration_manager")

# Пути к директориям и файлам
BASE_DIR = Path(__file__).parent
MIGRATIONS_DIR = BASE_DIR / "migrations"
VERSIONS_DIR = MIGRATIONS_DIR / "versions"
ALEMBIC_INI = BASE_DIR / "alembic.ini"
REPORT_DIR = BASE_DIR / "migration_reports"

# Если директория для отчетов не существует, создаем её
REPORT_DIR.mkdir(exist_ok=True)

# Переменные окружения для конфигурации БД
ENV = os.getenv("ENV", "development")
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"
DB_USER = os.getenv("DB_USER", "onboardpro")
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_secure_password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "onboardpro")


class MigrationManager:
    """Класс для управления миграциями в различных средах."""

    def __init__(self):
        """Инициализация менеджера миграций."""
        self.db_url = self._get_db_url()
        logger.info(
            f"Используется база данных: {self._get_sanitized_db_url()}")

        self.engine = create_engine(self.db_url)
        self.metadata = MetaData()
        self.session = sessionmaker(bind=self.engine)()
        self.alembic_config = self._get_alembic_config()

    def _get_db_url(self) -> str:
        """Получение URL базы данных на основе окружения."""
        if ENV == "test":
            return "sqlite:///:memory:"
        elif USE_SQLITE:
            return f"sqlite:///{BASE_DIR}/onboardpro.db"
        else:
            return f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    def _get_sanitized_db_url(self) -> str:
        """Получение URL базы данных для логов (без пароля)."""
        if USE_SQLITE:
            return f"sqlite:///{BASE_DIR}/onboardpro.db"
        else:
            return f"postgresql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    def _get_alembic_config(self) -> Config:
        """Получение конфигурации Alembic."""
        config = Config(str(ALEMBIC_INI))
        # Переопределяем URL базы данных для использования текущего окружения
        config.set_main_option("sqlalchemy.url", self.db_url)
        return config

    def get_current_revision(self) -> Optional[str]:
        """Получение текущей версии миграции из базы данных."""
        try:
            with self.engine.connect() as conn:
                context = MigrationContext.configure(conn)
                return context.get_current_revision()
        except Exception as e:
            logger.warning(f"Не удалось получить текущую версию миграции: {e}")
            return None

    def get_latest_migration_file(self) -> Optional[str]:
        """Получение последней версии миграции из файлов."""
        try:
            script_dir = ScriptDirectory.from_config(self.alembic_config)
            revisions = list(script_dir.walk_revisions())
            if revisions:
                # Первая версия в списке - последняя по времени
                return revisions[0].revision
            return None
        except Exception as e:
            logger.warning(
                f"Не удалось получить последнюю версию миграции из файлов: {e}")
            return None

    def get_migration_history(self) -> List[Dict[str, Any]]:
        """Получение истории миграций из файлов."""
        history = []
        try:
            script_dir = ScriptDirectory.from_config(self.alembic_config)
            for revision in script_dir.walk_revisions():
                revision_info = {
                    "revision": revision.revision,
                    "down_revision": revision.down_revision,
                    "description": revision.doc,
                    "created_date": self._extract_date_from_filename(revision.path),
                }
                history.append(revision_info)
            return history
        except Exception as e:
            logger.error(f"Ошибка при получении истории миграций: {e}")
            return []

    def _extract_date_from_filename(self, path: str) -> str:
        """Извлечение даты создания из имени файла миграции."""
        filename = os.path.basename(path)
        # Паттерн для извлечения даты в формате YYYYMMDD_HHMM
        match = re.search(r'(\d{8}_\d{4})', filename)
        if match:
            date_str = match.group(1)
            try:
                # Преобразование в читаемый формат
                dt = datetime.datetime.strptime(date_str, '%Y%m%d_%H%M')
                return dt.strftime('%Y-%m-%d %H:%M')
            except ValueError:
                pass
        return "Неизвестная дата"

    def check_alembic_version_table(self) -> bool:
        """Проверка наличия и корректности таблицы alembic_version."""
        try:
            with self.engine.connect() as conn:
                # Проверяем, существует ли таблица alembic_version
                if USE_SQLITE:
                    result = conn.execute(text(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'"
                    ))
                    table_exists = bool(result.fetchone())
                else:
                    result = conn.execute(text(
                        "SELECT table_name FROM information_schema.tables "
                        "WHERE table_schema='public' AND table_name='alembic_version'"
                    ))
                    table_exists = bool(result.fetchone())

                if not table_exists:
                    logger.warning("Таблица alembic_version не существует.")
                    return False

                # Проверяем наличие записи в таблице
                result = conn.execute(
                    text("SELECT version_num FROM alembic_version"))
                rows = result.fetchall()

                if not rows:
                    logger.warning("В таблице alembic_version нет записей.")
                    return False

                # Проверяем, соответствует ли версия в БД последней версии в файлах
                current_version = rows[0][0] if rows else None
                latest_version = self.get_latest_migration_file()

                if current_version != latest_version:
                    logger.warning(
                        f"Версия в БД ({current_version}) не соответствует последней версии в файлах ({latest_version}).")
                    return False

                logger.info(
                    f"Таблица alembic_version существует и содержит корректную версию: {current_version}")
                return True

        except Exception as e:
            logger.error(f"Ошибка при проверке таблицы alembic_version: {e}")
            return False

    def fix_alembic_version_table(self) -> bool:
        """Исправление таблицы alembic_version."""
        try:
            latest_version = self.get_latest_migration_file()
            if not latest_version:
                logger.error(
                    "Не удалось получить последнюю версию миграции из файлов.")
                return False

            with self.engine.connect() as conn:
                # Проверяем, существует ли таблица alembic_version
                if USE_SQLITE:
                    result = conn.execute(text(
                        "SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'"
                    ))
                    table_exists = bool(result.fetchone())
                else:
                    result = conn.execute(text(
                        "SELECT table_name FROM information_schema.tables "
                        "WHERE table_schema='public' AND table_name='alembic_version'"
                    ))
                    table_exists = bool(result.fetchone())

                if not table_exists:
                    # Создаем таблицу если она не существует
                    logger.info("Создание таблицы alembic_version...")
                    conn.execute(
                        text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
                    conn.commit()

                # Получаем текущую версию в таблице alembic_version
                try:
                    result = conn.execute(
                        text("SELECT version_num FROM alembic_version"))
                    rows = result.fetchall()

                    if not rows:
                        logger.info(
                            f"Добавление версии {latest_version} в пустую таблицу alembic_version...")
                        conn.execute(
                            text(f"INSERT INTO alembic_version (version_num) VALUES ('{latest_version}')"))
                    else:
                        current_version = rows[0][0]
                        if current_version != latest_version:
                            logger.info(
                                f"Обновление версии с '{current_version}' на '{latest_version}'")
                            conn.execute(text("DELETE FROM alembic_version"))
                            conn.execute(
                                text(f"INSERT INTO alembic_version (version_num) VALUES ('{latest_version}')"))

                    conn.commit()
                    logger.info("Таблица alembic_version успешно обновлена.")
                    return True
                except Exception as e:
                    logger.error(
                        f"Ошибка при обновлении таблицы alembic_version: {e}")
                    return False
        except Exception as e:
            logger.error(
                f"Ошибка при исправлении таблицы alembic_version: {e}")
            return False

    def check_database_schema(self) -> Dict[str, Any]:
        """Проверка схемы базы данных на соответствие миграциям."""
        report = {
            "tables": {},
            "missing_tables": [],
            "unexpected_tables": [],
            "missing_columns": {},
            "issues_found": False
        }

        try:
            # Получаем текущую схему БД
            with self.engine.connect() as conn:
                metadata = MetaData()
                metadata.reflect(bind=self.engine)

                # Получаем список всех ожидаемых таблиц и их столбцов
                # Этот список должен быть создан на основе моделей SQLAlchemy
                expected_tables = self._get_expected_tables()

                # Сравниваем текущую схему с ожидаемой
                current_tables = set(metadata.tables.keys())
                expected_table_names = set(expected_tables.keys())

                # Находим отсутствующие таблицы
                missing_tables = expected_table_names - current_tables
                if missing_tables:
                    report["missing_tables"] = list(missing_tables)
                    report["issues_found"] = True

                # Находим неожиданные таблицы (исключаем системные)
                unexpected_tables = current_tables - \
                    expected_table_names - {"alembic_version"}
                if unexpected_tables:
                    report["unexpected_tables"] = list(unexpected_tables)

                # Проверяем столбцы в существующих таблицах
                for table_name in current_tables:
                    if table_name in expected_tables:
                        expected_columns = set(expected_tables[table_name])
                        current_columns = set(
                            column.name for column in metadata.tables[table_name].columns)

                        report["tables"][table_name] = {
                            "columns": list(current_columns),
                            "status": "ok"
                        }

                        missing_columns = expected_columns - current_columns
                        if missing_columns:
                            report["missing_columns"][table_name] = list(
                                missing_columns)
                            report["tables"][table_name]["status"] = "missing_columns"
                            report["issues_found"] = True

            return report
        except Exception as e:
            logger.error(f"Ошибка при проверке схемы базы данных: {e}")
            return {
                "error": str(e),
                "issues_found": True
            }

    def _get_expected_tables(self) -> Dict[str, List[str]]:
        """Получение ожидаемых таблиц и их столбцов на основе моделей SQLAlchemy."""
        # Здесь должно быть получение структуры из моделей
        # Для прототипа используем фиксированный список основных таблиц
        return {
            "users": ["id", "email", "password", "first_name", "last_name",
                      "middle_name", "phone", "role", "department", "telegram_id",
                      "disabled", "photo", "session_id", "created_at", "updated_at"],
            "plans": ["id", "title", "description", "target_role", "department",
                      "duration_days", "created_at", "updated_at", "created_by"],
            "tasks": ["id", "plan_id", "user_id", "template_id", "title",
                      "description", "priority", "deadline", "status",
                      "created_at", "updated_at", "completed_at"],
            "feedback": ["id", "sender_id", "recipient_id", "task_id",
                         "content", "rating", "created_at"],
            "analytics": ["id", "user_id", "metric", "value",
                          "timestamp", "metadata"],
            "task_templates": ["id", "title", "description", "priority",
                               "duration_days", "department", "created_by",
                               "created_at"]
        }

    def add_missing_columns(self) -> Dict[str, Any]:
        """Добавление отсутствующих столбцов в таблицы."""
        report = {
            "added_columns": {},
            "errors": {},
            "success": True
        }

        # Проверяем схему базы данных
        schema_check = self.check_database_schema()

        if "missing_columns" not in schema_check or not schema_check["missing_columns"]:
            logger.info("Отсутствующих столбцов не найдено.")
            return report

        # Для каждой таблицы с отсутствующими столбцами
        for table_name, columns in schema_check["missing_columns"].items():
            report["added_columns"][table_name] = []

            for column_name in columns:
                try:
                    # Добавляем отсутствующий столбец
                    # Тип столбца определяем по имени (простая эвристика)
                    column_type = self._guess_column_type(column_name)

                    with self.engine.connect() as conn:
                        if USE_SQLITE:
                            conn.execute(text(
                                f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
                            ))
                        else:
                            conn.execute(text(
                                f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {column_type}"
                            ))
                        conn.commit()

                    report["added_columns"][table_name].append({
                        "column": column_name,
                        "type": column_type,
                        "status": "added"
                    })
                    logger.info(
                        f"Добавлен столбец {column_name} в таблицу {table_name}")

                except Exception as e:
                    logger.error(
                        f"Ошибка при добавлении столбца {column_name} в таблицу {table_name}: {e}")
                    if table_name not in report["errors"]:
                        report["errors"][table_name] = []

                    report["errors"][table_name].append({
                        "column": column_name,
                        "error": str(e)
                    })
                    report["success"] = False

        return report

    def _guess_column_type(self, column_name: str) -> str:
        """Угадывание типа столбца на основе его имени."""
        # Простая эвристика для определения типа
        if "id" in column_name.lower() and column_name.lower() != "disabled":
            return "INTEGER" if USE_SQLITE else "INTEGER"
        elif "date" in column_name.lower() or "time" in column_name.lower() or column_name.lower().endswith("_at"):
            return "TIMESTAMP" if USE_SQLITE else "TIMESTAMP"
        elif column_name.lower() in ["disabled", "is_active", "is_admin"]:
            return "BOOLEAN" if USE_SQLITE else "BOOLEAN"
        elif "description" in column_name.lower() or "content" in column_name.lower():
            return "TEXT" if USE_SQLITE else "TEXT"
        elif "price" in column_name.lower() or "amount" in column_name.lower() or "value" in column_name.lower():
            return "REAL" if USE_SQLITE else "NUMERIC(10, 2)"
        else:
            return "VARCHAR(255)" if USE_SQLITE else "VARCHAR(255)"

    def create_migration_report(self) -> Dict[str, Any]:
        """Создание полного отчета о состоянии миграций."""
        report = {
            "timestamp": datetime.datetime.now().isoformat(),
            "database": {
                "type": "SQLite" if USE_SQLITE else "PostgreSQL",
                "url": self._get_sanitized_db_url()
            },
            "alembic_version_table": {
                "exists": False,
                "current_version": None,
                "is_latest": False
            },
            "migrations": {
                "latest_version": None,
                "history": []
            },
            "schema": {},
            "issues": []
        }

        try:
            # Проверка таблицы alembic_version
            try:
                with self.engine.connect() as conn:
                    if USE_SQLITE:
                        result = conn.execute(text(
                            "SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version'"
                        ))
                        table_exists = bool(result.fetchone())
                    else:
                        result = conn.execute(text(
                            "SELECT table_name FROM information_schema.tables "
                            "WHERE table_schema='public' AND table_name='alembic_version'"
                        ))
                        table_exists = bool(result.fetchone())

                    report["alembic_version_table"]["exists"] = table_exists

                    if table_exists:
                        result = conn.execute(
                            text("SELECT version_num FROM alembic_version"))
                        rows = result.fetchall()
                        current_version = rows[0][0] if rows else None
                        report["alembic_version_table"]["current_version"] = current_version
            except Exception as e:
                report["issues"].append({
                    "type": "alembic_version_table_error",
                    "message": f"Ошибка при проверке таблицы alembic_version: {e}"
                })

            # Получаем информацию о миграциях
            latest_version = self.get_latest_migration_file()
            report["migrations"]["latest_version"] = latest_version

            if report["alembic_version_table"]["exists"] and report["alembic_version_table"]["current_version"]:
                report["alembic_version_table"]["is_latest"] = (
                    report["alembic_version_table"]["current_version"] == latest_version
                )

                if not report["alembic_version_table"]["is_latest"]:
                    report["issues"].append({
                        "type": "version_mismatch",
                        "message": f"Версия в БД ({report['alembic_version_table']['current_version']}) "
                        f"не соответствует последней версии в файлах ({latest_version})"
                    })

            # Получаем историю миграций
            report["migrations"]["history"] = self.get_migration_history()

            # Проверяем схему базы данных
            schema_check = self.check_database_schema()
            report["schema"] = schema_check

            # Добавляем проблемы со схемой в общий список проблем
            if schema_check.get("missing_tables"):
                report["issues"].append({
                    "type": "missing_tables",
                    "message": f"Отсутствуют таблицы: {', '.join(schema_check['missing_tables'])}"
                })

            if schema_check.get("missing_columns"):
                for table, columns in schema_check["missing_columns"].items():
                    report["issues"].append({
                        "type": "missing_columns",
                        "message": f"В таблице {table} отсутствуют столбцы: {', '.join(columns)}"
                    })

            # Сохраняем отчет в файл
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            report_file = REPORT_DIR / f"migration_report_{timestamp}.json"

            with open(report_file, "w") as f:
                json.dump(report, f, indent=2)

            logger.info(f"Отчет о миграциях сохранен в {report_file}")

            return report
        except Exception as e:
            logger.error(f"Ошибка при создании отчета о миграциях: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.datetime.now().isoformat()
            }

    def run_migrations(self, target_revision: Optional[str] = "head") -> bool:
        """Запуск миграций до указанной версии."""
        try:
            command.upgrade(self.alembic_config, target_revision)
            logger.info(
                f"Миграции успешно применены до версии {target_revision}")
            return True
        except Exception as e:
            logger.error(f"Ошибка при выполнении миграций: {e}")
            return False

    def create_migration(self, message: str) -> bool:
        """Создание новой миграции."""
        try:
            command.revision(
                self.alembic_config,
                message=message,
                autogenerate=True
            )
            logger.info(f"Создана новая миграция с сообщением: {message}")
            return True
        except Exception as e:
            logger.error(f"Ошибка при создании миграции: {e}")
            return False

    def show_migration_history(self) -> None:
        """Отображение истории миграций."""
        history = self.get_migration_history()

        if not history:
            logger.info(
                "История миграций пуста или не удалось получить информацию.")
            return

        current_revision = self.get_current_revision()

        print("\n=== История миграций ===")
        print("-" * 80)
        print(
            f"{'Ревизия':<15} | {'Родительская ревизия':<20} | {'Дата':<16} | {'Описание':<30}")
        print("-" * 80)

        for entry in history:
            is_current = entry["revision"] == current_revision
            marker = "➤ " if is_current else "  "

            print(f"{marker}{entry['revision']:<13} | "
                  f"{entry['down_revision'] or 'None':<20} | "
                  f"{entry['created_date']:<16} | "
                  f"{entry['description'][:30]}")

        print("-" * 80)
        print(f"Текущая ревизия в БД: {current_revision or 'Не установлена'}")
        print(
            f"Последняя ревизия в файлах: {self.get_latest_migration_file() or 'Не найдена'}")
        print("-" * 80)


def main():
    """Основная функция для выполнения команд."""
    parser = argparse.ArgumentParser(
        description="Управление миграциями базы данных OnboardPro")

    # Команды
    subparsers = parser.add_subparsers(
        dest="command", help="Команда управления миграциями")

    # check: Проверка состояния миграций
    check_parser = subparsers.add_parser(
        "check", help="Проверка состояния миграций")

    # fix: Исправление проблем с миграциями
    fix_parser = subparsers.add_parser(
        "fix", help="Исправление проблем с миграциями")

    # report: Создание отчета о миграциях
    report_parser = subparsers.add_parser(
        "report", help="Создание отчета о миграциях")

    # upgrade: Применение миграций
    upgrade_parser = subparsers.add_parser(
        "upgrade", help="Применение миграций")
    upgrade_parser.add_argument(
        "--revision", help="Версия до которой применять миграции", default="head")

    # create: Создание новой миграции
    create_parser = subparsers.add_parser(
        "create", help="Создание новой миграции")
    create_parser.add_argument("message", help="Описание изменений в миграции")

    # history: Показать историю миграций
    history_parser = subparsers.add_parser(
        "history", help="Показать историю миграций")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Инициализируем менеджер миграций
    manager = MigrationManager()

    if args.command == "check":
        # Проверка состояния миграций
        print("Проверка таблицы alembic_version...")
        alembic_status = manager.check_alembic_version_table()
        print(
            f"Статус таблицы alembic_version: {'OK' if alembic_status else 'Проблемы'}")

        print("\nПроверка схемы базы данных...")
        schema_check = manager.check_database_schema()

        if schema_check.get("missing_tables"):
            print(
                f"Отсутствуют таблицы: {', '.join(schema_check['missing_tables'])}")

        if schema_check.get("missing_columns"):
            print("Отсутствующие столбцы:")
            for table, columns in schema_check["missing_columns"].items():
                print(f"  {table}: {', '.join(columns)}")

        if not schema_check.get("issues_found"):
            print("Схема базы данных соответствует ожидаемой структуре.")

    elif args.command == "fix":
        # Исправление проблем с миграциями
        print("Исправление таблицы alembic_version...")
        alembic_fixed = manager.fix_alembic_version_table()
        print(
            f"Результат исправления: {'Успех' if alembic_fixed else 'Ошибка'}")

        print("\nДобавление отсутствующих столбцов...")
        columns_report = manager.add_missing_columns()

        if columns_report["added_columns"]:
            for table, columns in columns_report["added_columns"].items():
                if columns:
                    print(f"В таблицу {table} добавлены столбцы:")
                    for col in columns:
                        print(f"  - {col['column']} ({col['type']})")

        if columns_report["errors"]:
            print("\nОшибки при добавлении столбцов:")
            for table, errors in columns_report["errors"].items():
                for error in errors:
                    print(f"  {table}.{error['column']}: {error['error']}")

        if not columns_report["added_columns"] and not columns_report["errors"]:
            print("Отсутствующих столбцов не найдено.")

    elif args.command == "report":
        # Создание отчета о миграциях
        report = manager.create_migration_report()
        print(
            f"\nОтчет о миграциях создан и сохранен в директории {REPORT_DIR}")

        if report.get("issues"):
            print("\nОбнаруженные проблемы:")
            for issue in report["issues"]:
                print(f"  - {issue['message']}")
        else:
            print("\nПроблем не обнаружено!")

    elif args.command == "upgrade":
        # Применение миграций
        print(f"Применение миграций до версии {args.revision}...")
        success = manager.run_migrations(args.revision)
        if success:
            print("Миграции успешно применены!")
        else:
            print("При выполнении миграций возникли ошибки. Проверьте лог.")

    elif args.command == "create":
        # Создание новой миграции
        print(f"Создание новой миграции: {args.message}")
        success = manager.create_migration(args.message)
        if success:
            print("Миграция успешно создана!")
        else:
            print("При создании миграции возникли ошибки. Проверьте лог.")

    elif args.command == "history":
        # Показать историю миграций
        manager.show_migration_history()


if __name__ == "__main__":
    main()
