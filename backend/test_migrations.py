#!/usr/bin/env python3
"""
Скрипт для автоматического тестирования целостности миграций.
Может использоваться в CI/CD для проверки корректности миграций.
"""

import os
import sys
import argparse
import logging
import subprocess
from datetime import datetime
from pathlib import Path

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def setup_test_database():
    """Создает тестовую базу данных для проверки миграций."""
    try:
        test_db_path = "test_migrations.db"

        # Удаляем существующую тестовую БД, если она есть
        if os.path.exists(test_db_path):
            os.remove(test_db_path)
            logger.info(
                f"Удалена существующая тестовая база данных: {test_db_path}")

        # Устанавливаем переменную окружения для подключения к тестовой БД
        os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
        logger.info(
            f"Настроено подключение к тестовой базе данных: {test_db_path}")

        return True
    except Exception as e:
        logger.error(f"Ошибка при настройке тестовой базы данных: {e}")
        return False


def run_alembic_command(command, args=None):
    """Запускает команду alembic с указанными аргументами."""
    try:
        alembic_command = ["alembic", command]
        if args:
            alembic_command.extend(args)

        logger.info(f"Выполняется команда: {' '.join(alembic_command)}")
        process = subprocess.run(
            alembic_command, capture_output=True, text=True, check=True)

        if process.stdout:
            logger.info(process.stdout)

        return True, process.stdout
    except subprocess.CalledProcessError as e:
        logger.error(f"Ошибка выполнения команды alembic: {e}")
        if e.stdout:
            logger.error(f"STDOUT: {e.stdout}")
        if e.stderr:
            logger.error(f"STDERR: {e.stderr}")
        return False, e.stderr
    except Exception as e:
        logger.error(f"Неожиданная ошибка при выполнении команды alembic: {e}")
        return False, str(e)


def check_migration_integrity():
    """Проверяет целостность цепочки миграций."""
    # Вместо команды check используем history
    success, output = run_alembic_command("history")
    if not success:
        logger.error("Ошибка при получении истории миграций.")
        return False

    # Проверяем наличие разрывов в цепочке миграций
    revisions = []
    down_revisions = []

    try:
        # Извлекаем все файлы миграций
        migrations_dir = Path("migrations/versions")
        for migration_file in migrations_dir.glob("*.py"):
            with open(migration_file, "r") as f:
                content = f.read()

            # Извлекаем revision
            if "revision = '" in content:
                revision_line = [line for line in content.split(
                    "\n") if "revision = '" in line][0]
                revision_id = revision_line.split("'")[1]
                revisions.append(revision_id)

            # Извлекаем down_revision
            if "down_revision = '" in content:
                down_revision_line = [line for line in content.split(
                    "\n") if "down_revision = '" in line][0]
                down_revision_id = down_revision_line.split("'")[1]
                down_revisions.append(down_revision_id)
            elif "down_revision = None" in content:
                # Базовая миграция
                down_revisions.append(None)

        # Проверяем целостность цепочки миграций
        for rev in revisions:
            if rev not in down_revisions and len(revisions) > 1:
                logger.error(
                    f"Обнаружен разрыв цепочки миграций: ревизия {rev} не имеет следующей миграции")
                return False

        logger.info("Проверка целостности миграций успешна.")
        return True
    except Exception as e:
        logger.error(f"Ошибка при проверке целостности миграций: {e}")
        return False


def test_migrations_upgrading():
    """Тестирует применение всех миграций от начала до конца."""

    # Сначала проверяем, что нет миграций
    success, output = run_alembic_command("current")

    # Применяем все миграции
    success, output = run_alembic_command("upgrade", ["head"])
    if not success:
        logger.error("Не удалось применить миграции.")
        return False

    # Проверяем, что все миграции применены
    success, output = run_alembic_command("current")
    if not success or "head" not in output:
        logger.error(
            "После применения миграций не достигнута последняя версия.")
        return False

    logger.info("Тестирование применения миграций успешно завершено.")
    return True


def test_migrations_downgrading():
    """Тестирует откат всех миграций от конца до начала."""

    # Сначала проверяем, что все миграции применены
    success, output = run_alembic_command("current")
    if not success or "head" not in output:
        logger.error("Не все миграции применены перед тестированием отката.")
        return False

    # Откатываем все миграции
    success, output = run_alembic_command("downgrade", ["base"])
    if not success:
        logger.error("Не удалось откатить миграции.")
        return False

    # Проверяем, что все миграции откачены
    success, output = run_alembic_command("current")
    if not success:
        logger.error("Ошибка при проверке состояния миграций после отката.")
        return False

    logger.info("Тестирование отката миграций успешно завершено.")
    return True


def validate_model_schema_consistency():
    """Проверяет соответствие моделей SQLAlchemy схеме базы данных."""
    try:
        # Применяем все миграции для создания схемы
        success, output = run_alembic_command("upgrade", ["head"])
        if not success:
            logger.error(
                "Не удалось применить миграции для проверки соответствия схемы.")
            return False

        # Используем скрипт validate_db_models.py для проверки
        logger.info(
            "Проверка соответствия моделей SQLAlchemy схеме базы данных...")
        process = subprocess.run(
            ["python", "validate_db_models.py"], capture_output=True, text=True)

        if process.returncode != 0:
            logger.error(
                f"Ошибка при проверке соответствия схемы: {process.stderr}")
            return False

        logger.info("Соответствие моделей схеме базы данных подтверждено.")
        return True
    except Exception as e:
        logger.error(f"Ошибка при проверке соответствия моделей схеме: {e}")
        return False


def check_revision_naming():
    """Проверяет корректность именования ревизий миграций."""
    try:
        migrations_dir = Path("migrations/versions")
        errors = []

        for migration_file in migrations_dir.glob("*.py"):
            with open(migration_file, "r") as f:
                content = f.read()

            # Проверка на наличие дефисов в revision ID
            if "revision = '" in content:
                revision_line = [line for line in content.split(
                    "\n") if "revision = '" in line][0]
                revision_id = revision_line.split("'")[1]

                if "-" in revision_id:
                    errors.append(
                        f"Файл {migration_file.name}: revision ID содержит недопустимый символ '-': {revision_id}")

            # Проверка down_revision на None
            if "down_revision = None" in content and migration_file.name != "20250509_1203_consolidated_schema.py":
                errors.append(
                    f"Файл {migration_file.name}: down_revision = None для ревизии, которая не должна быть первой")

        if errors:
            for error in errors:
                logger.error(error)
            return False

        logger.info("Проверка именования ревизий успешно завершена.")
        return True
    except Exception as e:
        logger.error(f"Ошибка при проверке именования ревизий: {e}")
        return False


def generate_report(results):
    """Генерирует отчет о результатах тестирования миграций."""
    report = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "results": results,
        "success": all(results.values())
    }

    # Создаем директорию reports, если её нет
    reports_dir = Path("reports")
    reports_dir.mkdir(exist_ok=True)

    # Создаем отчет
    report_path = reports_dir / \
        f"migration_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_path, "w") as f:
        f.write(f"Отчет о тестировании миграций\n")
        f.write(f"Дата и время: {report['timestamp']}\n")
        f.write(
            f"Общий результат: {'УСПЕШНО' if report['success'] else 'ОШИБКА'}\n\n")

        f.write("Подробные результаты:\n")
        for test_name, success in results.items():
            f.write(f"- {test_name}: {'УСПЕШНО' if success else 'ОШИБКА'}\n")

    logger.info(f"Отчет о тестировании сохранен: {report_path}")
    return report


def main():
    parser = argparse.ArgumentParser(
        description="Тестирование целостности миграций")
    parser.add_argument("--skip-downgrade", action="store_true",
                        help="Пропустить тестирование отката миграций")

    args = parser.parse_args()

    # Настройка тестовой базы данных
    if not setup_test_database():
        logger.error(
            "Не удалось настроить тестовую базу данных. Завершение работы.")
        sys.exit(1)

    # Запуск тестов миграций
    results = {}

    # 1. Проверка целостности миграций
    results["integrity_check"] = check_migration_integrity()

    # 2. Проверка именования ревизий
    results["revision_naming"] = check_revision_naming()

    # 3. Тестирование применения миграций
    results["upgrade_test"] = test_migrations_upgrading()

    # 4. Тестирование отката миграций (опционально)
    if not args.skip_downgrade:
        results["downgrade_test"] = test_migrations_downgrading()

        # После отката нужно снова применить миграции для следующего теста
        success, _ = run_alembic_command("upgrade", ["head"])
        if not success:
            logger.error("Не удалось применить миграции после теста отката.")
            sys.exit(1)

    # 5. Проверка соответствия моделей схеме
    results["schema_consistency"] = validate_model_schema_consistency()

    # Генерация отчета
    report = generate_report(results)

    # Вывод итогового результата
    if report["success"]:
        logger.info("Все тесты миграций успешно пройдены.")
        sys.exit(0)
    else:
        logger.error(
            "Некоторые тесты миграций не пройдены. Смотрите отчет для деталей.")
        sys.exit(1)


if __name__ == "__main__":
    main()
