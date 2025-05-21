#!/usr/bin/env python
"""
Скрипт для тестирования системы проверки дедлайнов
"""

from notifications.signals import check_approaching_deadlines
from notifications.models import Notification
from onboarding.models import (
    OnboardingProgram,
    OnboardingStep,
    UserOnboardingAssignment,
    UserStepProgress
)
from users.models import User, UserRole
from django.utils import timezone
import os
import django
import datetime

# Установить переменную окружения для настроек Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Импортировать необходимые модели после настройки Django

print("Начало тестирования системы проверки дедлайнов...")

# 1. Получение или создание тестового пользователя
test_user = User.objects.filter(email='deadline_test@example.com').first()
if not test_user:
    print("Создание тестового пользователя...")
    test_user = User.objects.create_user(
        email='deadline_test@example.com',
        username='deadline_test',
        password='password123',
        full_name='Deadline Test User',
        role=UserRole.EMPLOYEE
    )
    print(f"Создан пользователь: {test_user}")
else:
    print(f"Найден существующий пользователь: {test_user}")

# 2. Создание тестовой программы и шагов с дедлайнами
test_program = OnboardingProgram.objects.filter(
    name='Deadline Test Program').first()
if not test_program:
    print("Создание тестовой программы онбординга...")
    admin_user = User.objects.filter(role=UserRole.ADMIN).first(
    ) or User.objects.filter(is_superuser=True).first()
    test_program = OnboardingProgram.objects.create(
        name='Deadline Test Program',
        description='Program for testing deadlines',
        author=admin_user
    )
    print(f"Создана программа: {test_program}")

    # Создаем шаги с разными дедлайнами
    step1 = OnboardingStep.objects.create(
        name='Step with deadline in 23 hours',
        description='This step has a deadline in 23 hours',
        step_type=OnboardingStep.StepType.TASK,
        order=1,
        program=test_program,
        deadline_days=1  # 1 день
    )

    step2 = OnboardingStep.objects.create(
        name='Step with deadline in 2 days',
        description='This step has a deadline in 2 days',
        step_type=OnboardingStep.StepType.TASK,
        order=2,
        program=test_program,
        deadline_days=2  # 2 дня
    )

    step3 = OnboardingStep.objects.create(
        name='Step with missed deadline',
        description='This step has a deadline that has passed',
        step_type=OnboardingStep.StepType.TASK,
        order=3,
        program=test_program,
        deadline_days=1  # 1 день
    )

    print(f"Созданы шаги: {step1}, {step2}, {step3}")
else:
    print(f"Найдена существующая программа: {test_program}")
    step1 = test_program.steps.get(order=1)
    step2 = test_program.steps.get(order=2)
    step3 = test_program.steps.get(order=3)

# 3. Создание или обновление тестового назначения онбординга
assignment = UserOnboardingAssignment.objects.filter(
    user=test_user, program=test_program).first()
if not assignment:
    print("Создание тестового назначения программы...")
    # Создаем назначение с датой "вчера" для тестирования дедлайнов
    yesterday = timezone.now() - timezone.timedelta(hours=23)  # 23 часа назад
    assignment = UserOnboardingAssignment.objects.create(
        user=test_user,
        program=test_program,
        assigned_at=yesterday,
        status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
    )
    print(f"Создано назначение с датой {yesterday}: {assignment}")
else:
    print(f"Найдено существующее назначение: {assignment}")
    # Обновляем дату назначения на "вчера"
    yesterday = timezone.now() - timezone.timedelta(hours=23)  # 23 часа назад
    assignment.assigned_at = yesterday
    assignment.save()
    print(f"Обновлена дата назначения на {yesterday}")

# 4. Создание прогресса по шагам
# Первый шаг - в процессе, с дедлайном через 23 часа от момента назначения
step1_progress = UserStepProgress.objects.filter(
    user=test_user, step=step1).first()
if not step1_progress:
    step1_progress = UserStepProgress.objects.create(
        user=test_user,
        step=step1,
        status=UserStepProgress.ProgressStatus.IN_PROGRESS
    )
    print(f"Создан прогресс для шага 1: {step1_progress}")
else:
    step1_progress.status = UserStepProgress.ProgressStatus.IN_PROGRESS
    step1_progress.completed_at = None
    step1_progress.save()
    print(f"Обновлен прогресс для шага 1: {step1_progress}")

# Второй шаг - в процессе, с дедлайном через 2 дня от момента назначения
step2_progress = UserStepProgress.objects.filter(
    user=test_user, step=step2).first()
if not step2_progress:
    step2_progress = UserStepProgress.objects.create(
        user=test_user,
        step=step2,
        status=UserStepProgress.ProgressStatus.IN_PROGRESS
    )
    print(f"Создан прогресс для шага 2: {step2_progress}")
else:
    step2_progress.status = UserStepProgress.ProgressStatus.IN_PROGRESS
    step2_progress.completed_at = None
    step2_progress.save()
    print(f"Обновлен прогресс для шага 2: {step2_progress}")

# Третий шаг - не начат, с уже пропущенным дедлайном (назначен "вчера" + 1 день дедлайна)
step3_progress = UserStepProgress.objects.filter(
    user=test_user, step=step3).first()
if not step3_progress:
    step3_progress = UserStepProgress.objects.create(
        user=test_user,
        step=step3,
        status=UserStepProgress.ProgressStatus.NOT_STARTED
    )
    print(f"Создан прогресс для шага 3: {step3_progress}")
else:
    step3_progress.status = UserStepProgress.ProgressStatus.NOT_STARTED
    step3_progress.completed_at = None
    step3_progress.save()
    print(f"Обновлен прогресс для шага 3: {step3_progress}")

# 5. Очистка существующих уведомлений
print("Очистка существующих уведомлений...")
Notification.objects.filter(recipient=test_user).delete()

# 6. Запуск проверки дедлайнов
print("\nЗапуск проверки дедлайнов...")
check_approaching_deadlines()

# 7. Проверка результатов
print("\nРезультаты проверки дедлайнов:")
deadline_notifications = Notification.objects.filter(
    recipient=test_user,
    notification_type='deadline'
).order_by('-created_at')

print(f"Создано уведомлений о дедлайнах: {deadline_notifications.count()}")
for i, notif in enumerate(deadline_notifications, 1):
    print(f"{i}. {notif.title}: {notif.message}")

# Проверка уведомлений о пропущенных дедлайнах для HR
hr_users = User.objects.filter(role=UserRole.HR)
print(f"\nКоличество HR-менеджеров: {hr_users.count()}")

for hr in hr_users:
    hr_missed_notifications = Notification.objects.filter(
        recipient=hr,
        notification_type='warning',
        message__contains='missed the deadline'
    ).order_by('-created_at')

    print(f"HR {hr.email} получил уведомлений о пропущенных дедлайнах: {hr_missed_notifications.count()}")
    for i, notif in enumerate(hr_missed_notifications, 1):
        print(f"{i}. {notif.title}: {notif.message}")

print("\nТестирование системы проверки дедлайнов завершено!")
