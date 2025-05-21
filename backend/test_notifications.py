#!/usr/bin/env python
"""
Скрипт для тестирования системы уведомлений
"""

from django.utils import timezone
from notifications.services import NotificationService
from notifications.models import Notification, NotificationType
from users.models import User, UserRole
import os
import django

# Установить переменную окружения для настроек Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Импортировать необходимые модели после настройки Django

print("Начало тестирования системы уведомлений...")

# 1. Получение тестового пользователя или создание нового
test_user = User.objects.filter(email='test@example.com').first()
if not test_user:
    print("Создание тестового пользователя...")
    test_user = User.objects.create_user(
        email='test@example.com',
        username='testuser',
        password='testpassword',
        full_name='Test User',
        role=UserRole.EMPLOYEE
    )
    print(f"Создан пользователь: {test_user}")
else:
    print(f"Найден существующий пользователь: {test_user}")

# 2. Создание тестового HR-менеджера
hr_user = User.objects.filter(email='hr@example.com').first()
if not hr_user:
    print("Создание тестового HR-менеджера...")
    hr_user = User.objects.create_user(
        email='hr@example.com',
        username='hruser',
        password='hrpassword',
        full_name='HR Manager',
        role=UserRole.HR
    )
    print(f"Создан HR-менеджер: {hr_user}")
else:
    print(f"Найден существующий HR-менеджер: {hr_user}")

# 3. Очистка существующих уведомлений для тестового пользователя
print("Очистка существующих уведомлений...")
notifications_count = Notification.objects.filter(recipient=test_user).delete()
print(f"Удалено уведомлений: {notifications_count}")

# 4. Создание тестовых уведомлений
print("Создание тестовых уведомлений...")

# Использование сервиса для создания уведомлений
notification_service = NotificationService()

# Информационное уведомление
info_notification = notification_service.send_notification(
    recipient=test_user,
    title='Добро пожаловать в OnboardPro',
    message='Ваш процесс онбординга начался! Ознакомьтесь с назначенными шагами.',
    notification_type=NotificationType.INFO
)
print(f"Создано информационное уведомление: {info_notification}")

# Уведомление о дедлайне
deadline_notification = notification_service.send_deadline_notification(
    recipient=test_user,
    title='Приближается дедлайн',
    message='У вас осталось менее 24 часов для выполнения шага "Изучение Git".'
)
print(f"Создано уведомление о дедлайне: {deadline_notification}")

# Предупреждение
warning_notification = notification_service.send_warning_notification(
    recipient=test_user,
    title='Не пройден тест',
    message='Вы не прошли тест по модулю "Основы Python". Пожалуйста, попробуйте снова.'
)
print(f"Создано предупреждение: {warning_notification}")

# 5. Создание уведомления для HR
hr_notification = notification_service.send_notification(
    recipient=hr_user,
    title='Сотрудник выполнил шаг',
    message=f'Сотрудник {test_user.get_full_name()} выполнил шаг "Настройка рабочего окружения".',
    notification_type=NotificationType.INFO
)
print(f"Создано уведомление для HR: {hr_notification}")

# 6. Получение списка уведомлений для пользователя
print("\nСписок уведомлений для пользователя:")
user_notifications = Notification.objects.filter(
    recipient=test_user).order_by('-created_at')
for i, notif in enumerate(user_notifications, 1):
    print(
        f"{i}. {notif.title} [{notif.get_notification_type_display()}] - {notif.is_read}")

# 7. Отметка уведомления как прочитанного
if user_notifications.exists():
    notif_to_mark = user_notifications.first()
    print(f"\nОтмечаем уведомление как прочитанное: {notif_to_mark.title}")
    notif_to_mark.mark_as_read()
    notif_to_mark.refresh_from_db()
    print(f"Статус после отметки: {notif_to_mark.is_read}")

# 8. Тест массовой отметки уведомлений
print("\nМассовая отметка уведомлений как прочитанных...")
count = notification_service.mark_all_as_read(test_user)
print(f"Отмечено уведомлений: {count}")

# Проверка результатов
print("\nСтатус уведомлений после массовой отметки:")
for i, notif in enumerate(user_notifications, 1):
    notif.refresh_from_db()
    print(f"{i}. {notif.title} - {notif.is_read}")

print("\nТестирование завершено успешно!")
