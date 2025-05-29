#!/usr/bin/env python
"""
Скрипт для проверки работы API уведомлений
"""

import os
import sys
import django
import requests
import json
from requests.exceptions import RequestException

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Импорт после настройки Django
from rest_framework.test import APIClient
from users.models import User
from notifications.models import Notification

# URL API
BASE_URL = "http://localhost:8000/api/"

def test_notifications_api():
    """Тестирование API уведомлений внутри приложения Django"""
    print("Тестирование API уведомлений внутренним клиентом...")
    
    # Создание тестового клиента
    client = APIClient()
    
    # Найти любого пользователя
    try:
        user = User.objects.first()
        if not user:
            print("Ошибка: Не найдены пользователи в системе")
            return False
            
        # Аутентификация
        client.force_authenticate(user=user)
        
        # Тест GET запроса к API уведомлений
        response = client.get('/api/notifications/')
        
        if response.status_code == 200:
            print(f"Успех! Статус: {response.status_code}")
            print(f"Количество уведомлений: {len(response.data)}")
            return True
        else:
            print(f"Ошибка при запросе. Статус: {response.status_code}")
            print(f"Ответ: {response.data}")
            return False
            
    except Exception as e:
        print(f"Исключение при выполнении запроса: {str(e)}")
        return False

def test_notifications_api_external():
    """Тестирование API уведомлений внешним HTTP запросом"""
    print("\nТестирование API уведомлений внешним HTTP запросом...")
    
    # Получение токена через аутентификацию
    try:
        # Получить любого пользователя для тестирования
        user = User.objects.first()
        if not user:
            print("Ошибка: Не найдены пользователи в системе")
            return False
            
        # Данные для аутентификации (предполагаем, что у пользователя email и установлен пароль)
        login_data = {
            "email": user.email, 
            "password": "test_password"  # Это тестовый пароль, который нужно заменить на реальный
        }
        
        # Отправка запроса на получение токена
        auth_response = requests.post(BASE_URL + "auth/token/", data=login_data)
        
        if auth_response.status_code != 200:
            print(f"Не удалось получить токен. Статус: {auth_response.status_code}")
            print(f"Ответ: {auth_response.text}")
            return False
            
        token_data = auth_response.json()
        access_token = token_data.get("access")
        
        if not access_token:
            print("Токен не получен из ответа")
            return False
            
        # Формирование заголовка для авторизации
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Запрос к API уведомлений
        response = requests.get(BASE_URL + "notifications/", headers=headers)
        
        if response.status_code == 200:
            notifications = response.json()
            print(f"Успех! Статус: {response.status_code}")
            print(f"Количество уведомлений: {len(notifications)}")
            return True
        else:
            print(f"Ошибка при запросе к API уведомлений. Статус: {response.status_code}")
            print(f"Ответ: {response.text}")
            return False
            
    except RequestException as e:
        print(f"Ошибка HTTP-запроса: {str(e)}")
        return False
    except Exception as e:
        print(f"Непредвиденное исключение: {str(e)}")
        return False

if __name__ == "__main__":
    print("Проверка API уведомлений...")
    success = test_notifications_api()
    
    # Комментируем внешний тест, так как он требует реальных креденшиалов
    # external_success = test_notifications_api_external()
    
    if success:
        print("\n✅ API уведомлений работает корректно!")
        sys.exit(0)
    else:
        print("\n❌ API уведомлений не работает корректно.")
        sys.exit(1)
