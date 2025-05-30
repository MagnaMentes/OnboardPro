"""
Smart Scheduler Engine - интеллектуальный планировщик шагов онбординга
"""

import logging
from datetime import datetime, timedelta
from django.db.models import Q, F
from django.utils import timezone
import pytz
from django.conf import settings
from onboarding.models import OnboardingStep, UserOnboardingAssignment, UserStepProgress
from users.models import User, UserRole
from .models import (
    ScheduledOnboardingStep, ScheduleConstraint, UserAvailability,
    MentorLoad, CalendarEvent
)

logger = logging.getLogger(__name__)


class SmartSchedulerEngine:
    """
    Сервис для интеллектуального планирования шагов онбординга с учетом:
    - расписания сотрудников и менторов
    - приоритетов и зависимостей шагов
    - выходных и праздничных дней
    - ограничений по ролям и временным слотам
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
        Временная реализация - в будущем можно расширить для интеграции с API праздников
        """
        # TODO: Интегрировать с API праздников или базой данных праздников
        holidays = getattr(settings, 'HOLIDAYS', {})
        date_str = date_to_check.strftime('%Y-%m-%d')
        return date_str in holidays

    @staticmethod
    def is_working_day(date_to_check):
        """
        Проверяет, является ли день рабочим
        """
        return not SmartSchedulerEngine.is_weekend(date_to_check) and not SmartSchedulerEngine.is_holiday(date_to_check)

    @staticmethod
    def get_available_time_slots(user, start_date, end_date, min_duration_minutes=30):
        """
        Получает доступные временные слоты пользователя на заданный период

        Args:
            user (User): Пользователь для поиска доступности
            start_date (datetime): Начальная дата периода
            end_date (datetime): Конечная дата периода
            min_duration_minutes (int): Минимальная продолжительность слота в минутах

        Returns:
            list: Список кортежей (start_time, end_time) доступных слотов
        """
        # Получаем рабочее время и предпочтения пользователя
        availabilities = UserAvailability.objects.filter(
            user=user,
            start_time__lt=end_date,
            end_time__gt=start_date,
            availability_type__in=[
                UserAvailability.AvailabilityType.WORKING_HOURS,
                UserAvailability.AvailabilityType.PREFERRED
            ]
        ).order_by('start_time')

        # Получаем уже занятое время (недоступности и календарные события)
        unavailable_slots = []

        # Добавляем отпуска и недоступности
        unavailabilities = UserAvailability.objects.filter(
            user=user,
            start_time__lt=end_date,
            end_time__gt=start_date,
            availability_type__in=[
                UserAvailability.AvailabilityType.VACATION,
                UserAvailability.AvailabilityType.UNAVAILABLE
            ]
        )

        for unavail in unavailabilities:
            unavailable_slots.append((unavail.start_time, unavail.end_time))

        # Добавляем запланированные события в календаре
        events = CalendarEvent.objects.filter(
            participants=user,
            start_time__lt=end_date,
            end_time__gt=start_date
        )

        for event in events:
            unavailable_slots.append((event.start_time, event.end_time))

        # Объединяем перекрывающиеся недоступные слоты
        unavailable_slots.sort(key=lambda x: x[0])
        merged_unavailable = []

        for start, end in unavailable_slots:
            if not merged_unavailable or start > merged_unavailable[-1][1]:
                merged_unavailable.append((start, end))
            else:
                merged_unavailable[-1] = (merged_unavailable[-1]
                                          [0], max(merged_unavailable[-1][1], end))

        # Находим доступные слоты на основе доступностей и недоступностей
        available_slots = []

        for avail in availabilities:
            start = max(avail.start_time, start_date)
            end = min(avail.end_time, end_date)

            # Если это рабочий день (для рабочих часов)
            if avail.availability_type == UserAvailability.AvailabilityType.WORKING_HOURS:
                if not SmartSchedulerEngine.is_working_day(start.date()):
                    continue

            # Проверяем доступный слот относительно недоступных периодов
            current = start

            for unavail_start, unavail_end in merged_unavailable:
                # Если есть доступное время до недоступного периода
                if current < unavail_start:
                    slot_end = min(unavail_start, end)
                    duration = (slot_end - current).total_seconds() / 60

                    # Добавляем только если слот достаточной продолжительности
                    if duration >= min_duration_minutes:
                        available_slots.append((current, slot_end))

                # Перемещаем текущее время после недоступного периода
                current = max(current, unavail_end)

                # Если вышли за пределы доступности, прерываем
                if current >= end:
                    break

            # Проверяем остался ли еще доступный слот после всех недоступных периодов
            if current < end:
                duration = (end - current).total_seconds() / 60
                if duration >= min_duration_minutes:
                    available_slots.append((current, end))

        return available_slots

    @staticmethod
    def get_step_constraints(step):
        """
        Получает все ограничения для шага

        Args:
            step (OnboardingStep): Шаг онбординга

        Returns:
            list: Список активных ограничений для шага
        """
        # Получаем ограничения, где этот шаг зависит от других
        dependency_constraints = ScheduleConstraint.objects.filter(
            dependent_step=step,
            constraint_type=ScheduleConstraint.ConstraintType.DEPENDENCY,
            active=True
        )

        # Получаем другие типы ограничений по шагу
        other_constraints = ScheduleConstraint.objects.filter(
            Q(dependent_step=step) | Q(prerequisite_step=step),
            constraint_type__in=[
                ScheduleConstraint.ConstraintType.TIME_SLOT,
                ScheduleConstraint.ConstraintType.WORKLOAD,
                ScheduleConstraint.ConstraintType.ROLE
            ],
            active=True
        )

        return list(dependency_constraints) + list(other_constraints)

    @staticmethod
    def check_step_prerequisites(step, user):
        """
        Проверяет выполнены ли все предпосылки для шага

        Args:
            step (OnboardingStep): Шаг для проверки
            user (User): Пользователь

        Returns:
            bool: True если все предпосылки выполнены, иначе False
        """
        # Получаем все зависимости для шага
        dependencies = ScheduleConstraint.objects.filter(
            dependent_step=step,
            constraint_type=ScheduleConstraint.ConstraintType.DEPENDENCY,
            active=True
        ).select_related('prerequisite_step')

        # Если нет зависимостей, считаем что предпосылки выполнены
        if not dependencies:
            return True

        # Проверяем каждую зависимость
        for dependency in dependencies:
            if not dependency.prerequisite_step:
                continue

            # Проверяем выполнен ли зависимый шаг
            prerequisite_progress = UserStepProgress.objects.filter(
                user=user,
                step=dependency.prerequisite_step,
                status=UserStepProgress.ProgressStatus.DONE
            ).exists()

            if not prerequisite_progress:
                return False

        return True

    @staticmethod
    def find_available_mentor(step, start_time, end_time):
        """
        Находит доступного ментора для шага в указанный временной слот

        Args:
            step (OnboardingStep): Шаг онбординга
            start_time (datetime): Время начала
            end_time (datetime): Время окончания

        Returns:
            User or None: Доступный ментор или None, если такого не найдено
        """
        duration_hours = (end_time - start_time).total_seconds() / 3600

        # Получаем всех активных менторов
        mentor_loads = MentorLoad.objects.filter(
            active=True).select_related('mentor')

        # Проверяем доступность каждого ментора
        for mentor_load in mentor_loads:
            # Проверяем нагрузку
            if not mentor_load.can_accommodate_session(start_time, duration_hours):
                continue

            # Проверяем доступность во временном слоте
            mentor_slots = SmartSchedulerEngine.get_available_time_slots(
                mentor_load.mentor, start_time, end_time,
                min_duration_minutes=int(duration_hours * 60)
            )

            # Если ментор доступен в указанный слот
            if any(slot_start <= start_time and slot_end >= end_time for slot_start, slot_end in mentor_slots):
                return mentor_load.mentor

        return None

    @staticmethod
    def schedule_step(step_progress, priority=1):
        """
        Планирует один шаг онбординга

        Args:
            step_progress (UserStepProgress): Прогресс шага пользователя
            priority (int): Приоритет планирования

        Returns:
            ScheduledOnboardingStep: Запланированный шаг или None в случае неудачи
        """
        user = step_progress.user
        step = step_progress.step

        # Проверяем выполнены ли предпосылки
        prerequisites_met = SmartSchedulerEngine.check_step_prerequisites(
            step, user)
        if not prerequisites_met:
            logger.warning(
                f"Cannot schedule step {step.id} for user {user.id}: prerequisites not met")
            return None

        # Получаем ограничения
        constraints = SmartSchedulerEngine.get_step_constraints(step)

        # Определяем тайм-зону пользователя (заглушка - в реальном проекте нужно получать из профиля)
        user_timezone = 'UTC'  # В будущем получать из профиля пользователя

        # Определяем начальное время для планирования
        if step_progress.planned_date_start:
            start_search_time = step_progress.planned_date_start
        else:
            # Если время не определено, начинаем с текущего
            start_search_time = timezone.now()

        # Вычисляем продолжительность шага
        if step.deadline_days:
            duration = timedelta(days=step.deadline_days)
        else:
            # По умолчанию 1 час для шагов без явной длительности
            duration = timedelta(hours=1)

        # Получаем доступные временные слоты пользователя на ближайшие 30 дней
        end_search_time = start_search_time + timedelta(days=30)
        available_slots = SmartSchedulerEngine.get_available_time_slots(
            user, start_search_time, end_search_time
        )

        # Выбираем подходящий временной слот
        suitable_slot = None
        chosen_mentor = None

        for slot_start, slot_end in available_slots:
            # Если шаг короче доступного слота, устанавливаем конец на начало + продолжительность
            if step.step_type == OnboardingStep.StepType.MEETING:
                # Для встреч находим подходящего ментора
                mentor = SmartSchedulerEngine.find_available_mentor(
                    step, slot_start, slot_start + duration)
                if mentor:
                    suitable_slot = (slot_start, slot_start + duration)
                    chosen_mentor = mentor
                    break
            else:
                # Для других типов шагов просто проверяем, что слот достаточной длины
                if (slot_end - slot_start) >= duration:
                    suitable_slot = (slot_start, slot_start + duration)
                    break

        if not suitable_slot:
            logger.warning(
                f"Could not find suitable time slot for step {step.id} and user {user.id}")
            return None

        # Создаем или обновляем запланированный шаг
        scheduled_step, created = ScheduledOnboardingStep.objects.update_or_create(
            step_progress=step_progress,
            defaults={
                'scheduled_start_time': suitable_slot[0],
                'scheduled_end_time': suitable_slot[1],
                'priority': priority,
                'time_zone': user_timezone
            }
        )

        # Обновляем информацию в UserStepProgress
        step_progress.planned_date_start = suitable_slot[0]
        step_progress.planned_date_end = suitable_slot[1]
        step_progress.save(
            update_fields=['planned_date_start', 'planned_date_end'])

        # Если это встреча, создаем событие календаря
        if step.step_type == OnboardingStep.StepType.MEETING and chosen_mentor:
            # Создаем или обновляем событие календаря
            calendar_event, created = CalendarEvent.objects.update_or_create(
                scheduled_step=scheduled_step,
                defaults={
                    'title': f"Онбординг: {step.name}",
                    'description': step.description,
                    'start_time': suitable_slot[0],
                    'end_time': suitable_slot[1],
                    'event_type': CalendarEvent.EventType.ONBOARDING_STEP,
                    'time_zone': user_timezone,
                }
            )

            # Добавляем участников
            calendar_event.participants.add(user)
            calendar_event.participants.add(chosen_mentor)

        return scheduled_step

    @staticmethod
    def plan_assignment(assignment_id):
        """
        Планирует все шаги для конкретного назначения онбординга

        Args:
            assignment_id: ID назначения онбординг-программы

        Returns:
            bool: True если планирование успешно, иначе False
        """
        try:
            assignment = UserOnboardingAssignment.objects.get(id=assignment_id)
        except UserOnboardingAssignment.DoesNotExist:
            logger.error(f"Assignment with ID {assignment_id} not found")
            return False

        user = assignment.user
        steps = OnboardingStep.objects.filter(
            program=assignment.program).order_by('order')

        # Получаем все записи прогресса пользователя для этой программы
        progresses = {}
        for progress in UserStepProgress.objects.filter(user=user, step__program=assignment.program):
            progresses[progress.step_id] = progress

        # Планируем каждый шаг
        for step in steps:
            # Получаем или создаем запись о прогрессе
            if step.id in progresses:
                progress = progresses[step.id]
            else:
                progress = UserStepProgress.objects.create(
                    user=user,
                    step=step,
                    status=UserStepProgress.ProgressStatus.NOT_STARTED
                )

            # Определяем приоритет (можно расширить логику в будущем)
            priority = 1
            if step.is_required:
                priority += 1

            # Планируем шаг
            SmartSchedulerEngine.schedule_step(progress, priority)

        return True

    @staticmethod
    def reschedule_dependent_steps(completed_step_progress):
        """
        Перепланирует шаги, зависящие от завершенного шага

        Args:
            completed_step_progress (UserStepProgress): Завершенный шаг

        Returns:
            int: Количество перепланированных шагов
        """
        step = completed_step_progress.step
        user = completed_step_progress.user

        # Находим все зависимые шаги
        dependent_constraints = ScheduleConstraint.objects.filter(
            prerequisite_step=step,
            constraint_type=ScheduleConstraint.ConstraintType.DEPENDENCY,
            active=True
        ).select_related('dependent_step')

        count = 0
        for constraint in dependent_constraints:
            if not constraint.dependent_step:
                continue

            # Получаем прогресс по зависимому шагу
            try:
                dependent_progress = UserStepProgress.objects.get(
                    user=user,
                    step=constraint.dependent_step
                )

                # Если шаг еще не выполнен, перепланируем его
                if dependent_progress.status != UserStepProgress.ProgressStatus.DONE:
                    SmartSchedulerEngine.schedule_step(
                        dependent_progress, priority=2)
                    count += 1

            except UserStepProgress.DoesNotExist:
                continue

        return count

    @staticmethod
    def detect_conflicts(user_id=None, start_date=None, end_date=None):
        """
        Обнаруживает конфликты в расписании

        Args:
            user_id (int): ID пользователя для проверки (если None, проверяются все)
            start_date (datetime): Начальная дата для проверки (если None, используется текущая)
            end_date (datetime): Конечная дата для проверки (если None, +30 дней от начальной)

        Returns:
            list: Список конфликтов в формате:
                [{'user_id': id, 'conflicts': [{'step1': step1, 'step2': step2, 'overlap_start': dt, 'overlap_end': dt}]}]
        """
        if not start_date:
            start_date = timezone.now()

        if not end_date:
            end_date = start_date + timedelta(days=30)

        conflicts = []

        # Фильтр по пользователю, если указан
        user_filter = {}
        if user_id:
            user_filter['step_progress__user__id'] = user_id

        # Получаем все запланированные шаги в указанный период
        scheduled_steps = ScheduledOnboardingStep.objects.filter(
            scheduled_start_time__lt=end_date,
            scheduled_end_time__gt=start_date,
            **user_filter
        ).select_related('step_progress', 'step_progress__step', 'step_progress__user')

        # Группируем шаги по пользователям
        users_steps = {}
        for step in scheduled_steps:
            user_id = step.step_progress.user.id
            if user_id not in users_steps:
                users_steps[user_id] = []
            users_steps[user_id].append(step)

        # Для каждого пользователя ищем конфликты
        for user_id, steps in users_steps.items():
            user_conflicts = []

            # Сравниваем каждый шаг с каждым
            for i in range(len(steps)):
                for j in range(i + 1, len(steps)):
                    step1 = steps[i]
                    step2 = steps[j]

                    # Проверяем перекрытие времени
                    if step1.scheduled_start_time < step2.scheduled_end_time and step2.scheduled_start_time < step1.scheduled_end_time:
                        # Определяем перекрытие
                        overlap_start = max(
                            step1.scheduled_start_time, step2.scheduled_start_time)
                        overlap_end = min(
                            step1.scheduled_end_time, step2.scheduled_end_time)

                        # Добавляем конфликт
                        user_conflicts.append({
                            'step1': {
                                'id': step1.id,
                                'name': step1.step_progress.step.name,
                                'start_time': step1.scheduled_start_time,
                                'end_time': step1.scheduled_end_time
                            },
                            'step2': {
                                'id': step2.id,
                                'name': step2.step_progress.step.name,
                                'start_time': step2.scheduled_start_time,
                                'end_time': step2.scheduled_end_time
                            },
                            'overlap_start': overlap_start,
                            'overlap_end': overlap_end
                        })

            # Если найдены конфликты для пользователя
            if user_conflicts:
                conflicts.append({
                    'user_id': user_id,
                    'user_name': steps[0].step_progress.user.get_full_name(),
                    'conflicts': user_conflicts
                })

        return conflicts

    @staticmethod
    def override_scheduled_step(scheduled_step_id, new_start_time, new_end_time):
        """
        Ручная корректировка запланированного шага

        Args:
            scheduled_step_id (int): ID запланированного шага
            new_start_time (datetime): Новое время начала
            new_end_time (datetime): Новое время окончания

        Returns:
            ScheduledOnboardingStep: Обновленный запланированный шаг или None в случае ошибки
        """
        try:
            scheduled_step = ScheduledOnboardingStep.objects.get(
                id=scheduled_step_id)
        except ScheduledOnboardingStep.DoesNotExist:
            logger.error(
                f"Scheduled step with ID {scheduled_step_id} not found")
            return None

        # Обновляем запланированный шаг
        scheduled_step.scheduled_start_time = new_start_time
        scheduled_step.scheduled_end_time = new_end_time
        scheduled_step.auto_scheduled = False  # Отмечаем, что это ручное планирование
        scheduled_step.save()

        # Обновляем связанный прогресс
        progress = scheduled_step.step_progress
        progress.planned_date_start = new_start_time
        progress.planned_date_end = new_end_time
        progress.save(update_fields=['planned_date_start', 'planned_date_end'])

        # Если есть связанные события календаря, обновляем их тоже
        for event in CalendarEvent.objects.filter(scheduled_step=scheduled_step):
            event.start_time = new_start_time
            event.end_time = new_end_time
            event.save(update_fields=['start_time', 'end_time'])

        return scheduled_step

    @staticmethod
    def get_user_schedule(user_id, start_date=None, end_date=None):
        """
        Получает расписание пользователя на указанный период

        Args:
            user_id (int): ID пользователя
            start_date (datetime): Начальная дата (если None, используется текущая)
            end_date (datetime): Конечная дата (если None, +30 дней от начальной)

        Returns:
            dict: Словарь с расписанием пользователя
        """
        if not start_date:
            start_date = timezone.now()

        if not end_date:
            end_date = start_date + timedelta(days=30)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.error(f"User with ID {user_id} not found")
            return None

        # Получаем запланированные шаги на указанный период
        scheduled_steps = ScheduledOnboardingStep.objects.filter(
            step_progress__user_id=user_id,
            scheduled_start_time__lt=end_date,
            scheduled_end_time__gt=start_date
        ).select_related(
            'step_progress', 'step_progress__step'
        ).order_by('scheduled_start_time')

        # Формируем данные о расписании
        steps_data = []
        for step in scheduled_steps:
            steps_data.append({
                'id': step.id,
                'step_name': step.step_progress.step.name,
                'step_description': step.step_progress.step.description,
                'step_type': step.step_progress.step.step_type,
                'start_time': step.scheduled_start_time,
                'end_time': step.scheduled_end_time,
                'status': step.step_progress.status,
                'is_auto_scheduled': step.auto_scheduled
            })

        # Получаем события календаря
        calendar_events = CalendarEvent.objects.filter(
            participants=user,
            start_time__lt=end_date,
            end_time__gt=start_date
        ).order_by('start_time')

        events_data = []
        for event in calendar_events:
            events_data.append({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'start_time': event.start_time,
                'end_time': event.end_time,
                'event_type': event.event_type,
                'location': event.location,
                'virtual_meeting_link': event.virtual_meeting_link
            })

        # Формируем финальный ответ
        schedule = {
            'user': {
                'id': user.id,
                'name': user.get_full_name(),
                'email': user.email
            },
            'steps': steps_data,
            'events': events_data,
            'period': {
                'start_date': start_date,
                'end_date': end_date
            }
        }

        return schedule
