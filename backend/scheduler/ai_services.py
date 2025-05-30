"""
Smart Prioritization Engine - AI-модуль для интеллектуального приоритизирования задач
"""

import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, F, Q, Avg
from onboarding.models import OnboardingStep, UserStepProgress, UserOnboardingAssignment
from .models import ScheduledOnboardingStep, ScheduleConstraint

logger = logging.getLogger(__name__)


class SmartPrioritizationEngine:
    """
    Модуль AI для интеллектуальной приоритизации шагов онбординга:
    - выделяет критически важные шаги
    - прогнозирует риски задержек
    - сбалансированно распределяет нагрузку
    """

    @staticmethod
    def calculate_step_priority(step, user=None):
        """
        Вычисляет приоритет шага на основе различных факторов

        Args:
            step (OnboardingStep): Шаг онбординга
            user (User, optional): Пользователь (если специфичный для пользователя)

        Returns:
            int: Уровень приоритета (1-10)
        """
        base_priority = 1

        # Если шаг обязательный, повышаем приоритет
        if step.is_required:
            base_priority += 2

        # Количество зависимых шагов
        dependency_count = ScheduleConstraint.objects.filter(
            prerequisite_step=step,
            constraint_type=ScheduleConstraint.ConstraintType.DEPENDENCY,
            active=True
        ).count()

        # Если от шага зависят другие, увеличиваем приоритет
        if dependency_count > 0:
            base_priority += min(dependency_count, 3)  # Макс +3 к приоритету

        # Если это встреча, увеличиваем приоритет
        if step.step_type == OnboardingStep.StepType.MEETING:
            base_priority += 1

        # Если указан пользователь, проверяем историю выполнения
        if user:
            # Проверяем прогресс пользователя
            try:
                progress = UserStepProgress.objects.get(user=user, step=step)

                # Если дедлайн близко, увеличиваем приоритет
                if progress.planned_date_end:
                    days_until_deadline = (
                        progress.planned_date_end - timezone.now()).days
                    if days_until_deadline <= 1:
                        base_priority += 3
                    elif days_until_deadline <= 3:
                        base_priority += 2
                    elif days_until_deadline <= 7:
                        base_priority += 1
            except UserStepProgress.DoesNotExist:
                pass

        # Ограничиваем максимум приоритета
        return min(base_priority, 10)

    @staticmethod
    def identify_critical_steps(program_id=None):
        """
        Определяет критически важные шаги (высокоприоритетные)

        Args:
            program_id (int, optional): ID программы для анализа (если None, анализируются все)

        Returns:
            list: Список критически важных шагов с их метриками
        """
        filter_params = {}
        if program_id:
            filter_params['program_id'] = program_id

        steps = OnboardingStep.objects.filter(**filter_params)

        critical_steps = []
        for step in steps:
            # Собираем метрики для шага
            metrics = {}

            # Количество зависимых шагов
            dependencies = ScheduleConstraint.objects.filter(
                prerequisite_step=step,
                constraint_type=ScheduleConstraint.ConstraintType.DEPENDENCY
            ).count()
            metrics['dependency_count'] = dependencies

            # История выполнения (средняя задержка)
            progress_history = UserStepProgress.objects.filter(
                step=step,
                actual_completed_at__isnull=False,
                planned_date_end__isnull=False
            )

            avg_delay = 0
            on_time_percentage = 0

            if progress_history.exists():
                total_delays = 0
                on_time_count = 0

                for progress in progress_history:
                    if progress.actual_completed_at > progress.planned_date_end:
                        # Вычисляем задержку в днях
                        delay = (progress.actual_completed_at -
                                 progress.planned_date_end).days
                        total_delays += delay
                    else:
                        on_time_count += 1

                avg_delay = total_delays / progress_history.count() if total_delays > 0 else 0
                on_time_percentage = (
                    on_time_count / progress_history.count()) * 100

            metrics['average_delay_days'] = avg_delay
            metrics['on_time_percentage'] = on_time_percentage

            # Вычисляем базовый приоритет
            base_priority = SmartPrioritizationEngine.calculate_step_priority(
                step)

            # Добавляем к приоритету если есть задержки по истории
            priority = base_priority
            if avg_delay > 3:
                priority += 2
            elif avg_delay > 1:
                priority += 1

            # Определяем критические шаги с приоритетом >= 7
            if priority >= 7:
                critical_steps.append({
                    'step_id': step.id,
                    'step_name': step.name,
                    'priority': priority,
                    'metrics': metrics,
                    'is_required': step.is_required,
                    'step_type': step.step_type
                })

        # Сортируем по приоритету (по убыванию)
        critical_steps.sort(key=lambda x: x['priority'], reverse=True)

        return critical_steps

    @staticmethod
    def predict_delay_risks(assignment_id):
        """
        Прогнозирует риски задержек для конкретного назначения онбординга

        Args:
            assignment_id (int): ID назначения для анализа

        Returns:
            list: Список шагов с оценкой риска задержки
        """
        try:
            assignment = UserOnboardingAssignment.objects.get(id=assignment_id)
        except UserOnboardingAssignment.DoesNotExist:
            logger.error(f"Assignment with ID {assignment_id} not found")
            return []

        user = assignment.user
        steps = OnboardingStep.objects.filter(program=assignment.program)

        risks = []
        for step in steps:
            try:
                progress = UserStepProgress.objects.get(user=user, step=step)
            except UserStepProgress.DoesNotExist:
                continue

            # Если шаг уже выполнен, риска нет
            if progress.status == UserStepProgress.ProgressStatus.DONE:
                continue

            # Считаем риск задержки на основе различных факторов
            risk_score = 0
            risk_factors = []

            # Фактор 1: близость дедлайна
            if progress.planned_date_end:
                days_until_deadline = (
                    progress.planned_date_end - timezone.now()).days

                if days_until_deadline < 0:
                    # Уже просрочен
                    risk_score += 5
                    risk_factors.append("Шаг просрочен")
                elif days_until_deadline == 0:
                    # Дедлайн сегодня
                    risk_score += 4
                    risk_factors.append("Дедлайн сегодня")
                elif days_until_deadline <= 2:
                    # Близкий дедлайн
                    risk_score += 3
                    risk_factors.append("Близкий дедлайн")
                elif days_until_deadline <= 5:
                    # Приближающийся дедлайн
                    risk_score += 1
                    risk_factors.append("Приближающийся дедлайн")

            # Фактор 2: не выполнены предпосылки
            dependencies = ScheduleConstraint.objects.filter(
                dependent_step=step,
                constraint_type=ScheduleConstraint.ConstraintType.DEPENDENCY,
                active=True
            ).select_related('prerequisite_step')

            for dependency in dependencies:
                if dependency.prerequisite_step:
                    try:
                        prereq_progress = UserStepProgress.objects.get(
                            user=user,
                            step=dependency.prerequisite_step
                        )

                        if prereq_progress.status != UserStepProgress.ProgressStatus.DONE:
                            risk_score += 2
                            risk_factors.append(
                                f"Не завершена предпосылка: {dependency.prerequisite_step.name}")
                    except UserStepProgress.DoesNotExist:
                        risk_score += 2
                        risk_factors.append(
                            f"Отсутствует предпосылка: {dependency.prerequisite_step.name}")

            # Фактор 3: исторические проблемы с этим типом шага
            step_type_history = UserStepProgress.objects.filter(
                user=user,
                step__step_type=step.step_type,
                status=UserStepProgress.ProgressStatus.DONE,
                actual_completed_at__isnull=False,
                planned_date_end__isnull=False
            ).exclude(step=step)

            delay_count = 0
            for progress_item in step_type_history:
                if progress_item.actual_completed_at > progress_item.planned_date_end:
                    delay_count += 1

            if step_type_history.count() > 0:
                delay_ratio = delay_count / step_type_history.count()

                if delay_ratio > 0.5:
                    risk_score += 2
                    risk_factors.append(
                        f"Высокий процент задержек для шагов типа {step.get_step_type_display()}")
                elif delay_ratio > 0.25:
                    risk_score += 1
                    risk_factors.append(
                        f"Средний процент задержек для шагов типа {step.get_step_type_display()}")

            # Определяем уровень риска
            risk_level = "Низкий"
            if risk_score >= 7:
                risk_level = "Высокий"
            elif risk_score >= 4:
                risk_level = "Средний"

            risks.append({
                'step_id': step.id,
                'step_name': step.name,
                'risk_score': risk_score,
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'planned_date_end': progress.planned_date_end
            })

        # Сортируем по уровню риска (по убыванию)
        risks.sort(key=lambda x: x['risk_score'], reverse=True)

        return risks

    @staticmethod
    def optimize_workload_distribution(user_ids=None, start_date=None, end_date=None):
        """
        Оптимизирует распределение нагрузки между пользователями

        Args:
            user_ids (list, optional): Список ID пользователей (если None, оптимизируется для всех)
            start_date (datetime, optional): Начальная дата (если None, используется текущая)
            end_date (datetime, optional): Конечная дата (если None, +30 дней от начальной)

        Returns:
            dict: Результаты оптимизации и рекомендации
        """
        if not start_date:
            start_date = timezone.now()

        if not end_date:
            end_date = start_date + timedelta(days=30)

        # Фильтр по пользователям
        user_filter = {}
        if user_ids:
            user_filter['step_progress__user__id__in'] = user_ids

        # Получаем всех менторов и их текущую нагрузку
        from .models import MentorLoad
        mentor_loads = MentorLoad.objects.filter(
            active=True).select_related('mentor')

        # Анализируем текущее распределение нагрузки
        scheduled_steps = ScheduledOnboardingStep.objects.filter(
            scheduled_start_time__lt=end_date,
            scheduled_end_time__gt=start_date,
            **user_filter
        ).select_related(
            'step_progress', 'step_progress__step', 'step_progress__user'
        )

        # Группируем шаги по пользователям
        user_workload = {}
        for step in scheduled_steps:
            user_id = step.step_progress.user.id

            if user_id not in user_workload:
                user_workload[user_id] = {
                    'steps': [],
                    'total_duration': 0,
                    'user_name': step.step_progress.user.get_full_name(),
                    'user_email': step.step_progress.user.email
                }

            # Рассчитываем продолжительность шага в часах
            duration_hours = (step.scheduled_end_time -
                              step.scheduled_start_time).total_seconds() / 3600

            user_workload[user_id]['steps'].append({
                'step_id': step.step_progress.step.id,
                'step_name': step.step_progress.step.name,
                'start_time': step.scheduled_start_time,
                'end_time': step.scheduled_end_time,
                'duration_hours': duration_hours
            })

            user_workload[user_id]['total_duration'] += duration_hours

        # Вычисляем среднюю нагрузку
        total_workload = sum(data['total_duration']
                             for data in user_workload.values())
        avg_workload = total_workload / \
            len(user_workload) if user_workload else 0

        # Определяем пользователей с чрезмерной и недостаточной нагрузкой
        overloaded_users = []
        underloaded_users = []
        threshold_percentage = 20  # Процент отклонения от среднего

        for user_id, data in user_workload.items():
            # Если нагрузка на 20% выше средней
            if data['total_duration'] > avg_workload * (1 + threshold_percentage/100):
                overloaded_users.append({
                    'user_id': user_id,
                    'name': data['user_name'],
                    'email': data['user_email'],
                    'workload': data['total_duration'],
                    'overload_percentage': ((data['total_duration'] - avg_workload) / avg_workload) * 100
                })
            # Если нагрузка на 20% ниже средней
            elif data['total_duration'] < avg_workload * (1 - threshold_percentage/100):
                underloaded_users.append({
                    'user_id': user_id,
                    'name': data['user_name'],
                    'email': data['user_email'],
                    'workload': data['total_duration'],
                    'capacity_percentage': ((avg_workload - data['total_duration']) / avg_workload) * 100
                })

        # Формируем рекомендации по балансировке
        recommendations = []

        # Сортируем пользователей по степени перегрузки/недогрузки
        overloaded_users.sort(
            key=lambda x: x['overload_percentage'], reverse=True)
        underloaded_users.sort(
            key=lambda x: x['capacity_percentage'], reverse=True)

        # Для каждого перегруженного пользователя пытаемся найти партнера с недостаточной нагрузкой
        for overloaded in overloaded_users:
            if not underloaded_users:
                break

            underloaded = underloaded_users[0]

            # Находим шаги, которые можно перераспределить
            user_steps = user_workload[overloaded['user_id']]['steps']

            # Сортируем по продолжительности (от короткого к длинному)
            user_steps.sort(key=lambda x: x['duration_hours'])

            for step in user_steps:
                # Если перераспределение этого шага улучшит баланс
                if step['duration_hours'] <= overloaded['overload_percentage'] * avg_workload / 100:
                    recommendations.append({
                        'action': 'reassign_step',
                        'step_id': step['step_id'],
                        'step_name': step['step_name'],
                        'from_user_id': overloaded['user_id'],
                        'from_user_name': overloaded['name'],
                        'to_user_id': underloaded['user_id'],
                        'to_user_name': underloaded['name'],
                        'workload_hours': step['duration_hours']
                    })

                    # Обновляем состояние нагрузки
                    overloaded['workload'] -= step['duration_hours']
                    overloaded['overload_percentage'] = (
                        (overloaded['workload'] - avg_workload) / avg_workload) * 100

                    underloaded['workload'] += step['duration_hours']
                    underloaded['capacity_percentage'] = (
                        (avg_workload - underloaded['workload']) / avg_workload) * 100

                    # Если перераспределение снизило нагрузку до приемлемого уровня, прерываем
                    if overloaded['workload'] <= avg_workload * (1 + threshold_percentage/100):
                        break

            # Пересортируем список недогруженных пользователей
            underloaded_users.sort(
                key=lambda x: x['capacity_percentage'], reverse=True)

        return {
            'average_workload_hours': avg_workload,
            'overloaded_users': overloaded_users,
            'underloaded_users': underloaded_users,
            'recommendations': recommendations
        }
