"""
Скрипт для проверки наличия моделей dashboard в Django
"""
from feedback.dashboard_models import FeedbackTrendSnapshot, FeedbackTrendRule, FeedbackTrendAlert
from django.apps import apps
import os
import sys
import django

# Добавляем родительский каталог в sys.path для импорта модулей проекта
sys.path.append('/app/backend')

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Импортируем модели

# Проверяем регистрацию моделей
app_config = apps.get_app_config('feedback')
print("Зарегистрированные модели в приложении feedback:")
for model in app_config.get_models():
    print(f"- {model.__name__}")

# Проверяем конкретно наши модели
print("\nПроверка наших dashboard моделей:")
print(f"FeedbackTrendSnapshot: {FeedbackTrendSnapshot._meta.app_label}")
print(f"FeedbackTrendRule: {FeedbackTrendRule._meta.app_label}")
print(f"FeedbackTrendAlert: {FeedbackTrendAlert._meta.app_label}")
