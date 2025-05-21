import asyncio
import threading
import time
from django.utils import timezone
from .signals import check_approaching_deadlines


def check_deadlines_thread():
    """
    Функция для выполнения в отдельном потоке, которая периодически проверяет дедлайны
    """
    while True:
        # Запускаем проверку дедлайнов
        check_approaching_deadlines()

        # Ждем 1 час перед следующей проверкой
        # В реальном проекте это можно сделать более настраиваемым
        time.sleep(3600)  # 3600 секунд = 1 час


def start_deadline_check_task():
    """
    Запускает фоновый поток для проверки дедлайнов
    """
    thread = threading.Thread(target=check_deadlines_thread, daemon=True)
    thread.start()
