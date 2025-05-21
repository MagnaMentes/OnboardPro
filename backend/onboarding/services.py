"""
Smart Scheduler Service для управления дедлайнами шагов онбординга
"""

from django.utils import timezone
from datetime import timedelta, date
from .models import OnboardingStep, UserOnboardingAssignment, UserStepProgress


class SmartSchedulerService:
    """
    Сервис для умного планирования шагов онбординга с учетом рабочих дней,
    выходных и праздников
    """

    @staticmethod
    def is_weekend(date_to_check):
        """
        Проверяет, является ли день выходным (суббота или воскресенье)
        """
        return date_to_check.weekday() >= 5  # 5 - суббота, 6 - воскресенье

    @staticmethod
    def is_holiday(date_to_check):
        """
        Проверяет, является ли день праздничным
        На данный момент - заглушка, в будущем можно расширить
        для подключения календаря праздников из базы данных или API
        """
        # В будущем может быть реализовано получение праздников из БД или API
        # Сейчас возвращаем False, так как у нас нет данных о праздниках
        return False

    @staticmethod
    def is_working_day(date_to_check):
        """
        Проверяет, является ли день рабочим
        """
        return not SmartSchedulerService.is_weekend(date_to_check) and not SmartSchedulerService.is_holiday(date_to_check)

    @staticmethod
    def add_working_days(start_date, days_to_add):
        """
        Добавляет указанное количество рабочих дней к дате
        Пропускает выходные и праздничные дни
        """
        if days_to_add < 1:
            return start_date

        # Конвертируем datetime в date, если нужно
        if hasattr(start_date, 'date'):
            start_as_date = start_date.date()
        else:
            start_as_date = start_date

        # Получим конечную дату, учитывая только рабочие дни
        current_date = start_as_date
        working_days_added = 0

        while working_days_added < days_to_add:
            current_date += timedelta(days=1)
            if SmartSchedulerService.is_working_day(current_date):
                working_days_added += 1

        # Если начальная дата была datetime, возвращаем datetime
        if hasattr(start_date, 'date'):
            # Сохраняем время от оригинальной даты
            return timezone.datetime.combine(
                current_date,
                start_date.time(),
                tzinfo=start_date.tzinfo
            )

        return current_date

    @staticmethod
    def schedule_steps(assignment):
        """
        Распределяет шаги по времени с учетом рабочих дней

        Алгоритм:
        1. Начинаем с даты назначения программы (assigned_at)
        2. Для каждого шага:
           - Если шаг необязательный, он может выполняться параллельно с предыдущим
           - Если шаг обязательный, добавляем его deadline_days к текущей дате
        3. Устанавливаем planned_date_start и planned_date_end для каждого шага
        """
        # Получаем все шаги программы, отсортированные по порядку
        steps = OnboardingStep.objects.filter(
            program=assignment.program
        ).order_by('order')

        # Начальная дата - это дата назначения программы
        current_date = assignment.assigned_at

        # Распределяем шаги
        for step in steps:
            # Получаем или создаем запись о прогрессе
            progress, created = UserStepProgress.objects.get_or_create(
                user=assignment.user,
                step=step,
                defaults={'status': UserStepProgress.ProgressStatus.NOT_STARTED}
            )

            # Устанавливаем planned_date_start
            progress.planned_date_start = current_date

            # Вычисляем planned_date_end с учетом рабочих дней
            if step.deadline_days:
                end_date = SmartSchedulerService.add_working_days(
                    current_date, step.deadline_days)
            else:
                # Если deadline_days не указан, используем ту же дату
                end_date = current_date

            progress.planned_date_end = end_date
            progress.save()

            # Если шаг обязательный, следующий шаг начнется после него
            if step.is_required:
                current_date = end_date

            # Если шаг не обязательный, следующий шаг может начаться
            # одновременно с этим (current_date не меняется)

    @staticmethod
    def schedule_assignment(assignment_id):
        """
        Планирует шаги для конкретного назначения по ID
        """
        try:
            assignment = UserOnboardingAssignment.objects.get(id=assignment_id)
            SmartSchedulerService.schedule_steps(assignment)
            return True
        except UserOnboardingAssignment.DoesNotExist:
            return False
