from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
import logging
from onboarding.models import UserOnboardingAssignment, UserStepProgress, OnboardingStep
from scheduler.models import ScheduledOnboardingStep, ScheduleConstraint
from scheduler.services import SmartSchedulerEngine

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Анализирует изменения и перегенерирует расписание по необходимости'

    def add_arguments(self, parser):
        # Период для анализа в днях (по умолчанию 30 дней)
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Количество дней для анализа (по умолчанию 30)'
        )

        # Опция для указания конкретного назначения
        parser.add_argument(
            '--assignment',
            type=int,
            help='ID конкретного назначения для перепланирования'
        )

        # Опция для указания конкретного пользователя
        parser.add_argument(
            '--user',
            type=int,
            help='ID пользователя для перепланирования всех его назначений'
        )

        # Опция для принудительного перепланирования, даже если нет изменений
        parser.add_argument(
            '--force',
            action='store_true',
            help='Принудительное перепланирование'
        )

    def handle(self, *args, **options):
        start_time = timezone.now()
        self.stdout.write(f'Начинаем перепланирование: {start_time}')

        days = options['days']
        assignment_id = options.get('assignment')
        user_id = options.get('user')
        force = options.get('force', False)

        # Определяем период для анализа
        analyze_start = timezone.now()
        analyze_end = analyze_start + timedelta(days=days)

        # Счетчики статистики
        stats = {
            'analyzed_assignments': 0,
            'rescheduled_assignments': 0,
            'total_steps': 0,
            'rescheduled_steps': 0,
            'conflicts_before': 0,
            'conflicts_after': 0,
            'failed_reschedules': 0
        }

        # 1. Если указан конкретный assignment_id
        if assignment_id:
            self.stdout.write(
                f'Перепланирование для назначения #{assignment_id}')
            try:
                assignment = UserOnboardingAssignment.objects.get(
                    id=assignment_id)
                self._reschedule_assignment(assignment, force, stats)
            except UserOnboardingAssignment.DoesNotExist:
                raise CommandError(
                    f'Назначение с ID {assignment_id} не найдено')

        # 2. Если указан user_id
        elif user_id:
            self.stdout.write(f'Перепланирование для пользователя #{user_id}')
            assignments = UserOnboardingAssignment.objects.filter(
                user_id=user_id,
                status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
            )

            for assignment in assignments:
                self._reschedule_assignment(assignment, force, stats)

        # 3. Анализируем все активные назначения в заданном периоде
        else:
            self.stdout.write(
                f'Анализ всех активных назначений на период {days} дней')

            # Получаем все активные назначения
            assignments = UserOnboardingAssignment.objects.filter(
                status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
            )

            # Подсчитываем конфликты до перепланирования
            conflicts_before = len(SmartSchedulerEngine.detect_conflicts(
                start_date=analyze_start,
                end_date=analyze_end
            ))
            stats['conflicts_before'] = conflicts_before

            # Анализируем каждое назначение
            for assignment in assignments:
                self._analyze_assignment(
                    assignment, analyze_start, analyze_end, force, stats)

            # Подсчитываем конфликты после перепланирования
            conflicts_after = len(SmartSchedulerEngine.detect_conflicts(
                start_date=analyze_start,
                end_date=analyze_end
            ))
            stats['conflicts_after'] = conflicts_after

        # Выводим статистику
        end_time = timezone.now()
        duration = (end_time - start_time).total_seconds()

        self.stdout.write(self.style.SUCCESS(
            f'\nПерепланирование завершено за {duration:.2f} секунд'
        ))
        self.stdout.write(
            f'Проанализировано назначений: {stats["analyzed_assignments"]}')
        self.stdout.write(
            f'Перепланировано назначений: {stats["rescheduled_assignments"]}')
        self.stdout.write(f'Всего шагов: {stats["total_steps"]}')
        self.stdout.write(
            f'Перепланировано шагов: {stats["rescheduled_steps"]}')

        if 'conflicts_before' in stats and 'conflicts_after' in stats:
            self.stdout.write(f'Конфликтов до: {stats["conflicts_before"]}')
            self.stdout.write(f'Конфликтов после: {stats["conflicts_after"]}')

            if stats['conflicts_before'] > stats['conflicts_after']:
                self.stdout.write(self.style.SUCCESS(
                    f'Количество конфликтов уменьшилось на {stats["conflicts_before"] - stats["conflicts_after"]}'
                ))
            elif stats['conflicts_before'] < stats['conflicts_after']:
                self.stdout.write(self.style.WARNING(
                    f'Количество конфликтов увеличилось на {stats["conflicts_after"] - stats["conflicts_before"]}'
                ))
            else:
                self.stdout.write('Количество конфликтов не изменилось')

        if stats['failed_reschedules'] > 0:
            self.stdout.write(self.style.WARNING(
                f'Не удалось перепланировать: {stats["failed_reschedules"]}'
            ))

    def _reschedule_assignment(self, assignment, force, stats):
        """
        Перепланирует все шаги для конкретного назначения
        """
        user = assignment.user
        program = assignment.program

        self.stdout.write(
            f'Перепланирование программы "{program.name}" для {user.email}')

        # Получаем все шаги для этого назначения
        steps = OnboardingStep.objects.filter(
            program=program).order_by('order')
        steps_count = steps.count()
        stats['total_steps'] += steps_count

        # Запускаем планирование
        success = SmartSchedulerEngine.plan_assignment(assignment.id)

        if success:
            stats['rescheduled_assignments'] += 1
            stats['rescheduled_steps'] += steps_count
            self.stdout.write(self.style.SUCCESS(
                f'Успешно перепланировано {steps_count} шагов для {user.email}'
            ))
        else:
            stats['failed_reschedules'] += 1
            self.stdout.write(self.style.ERROR(
                f'Не удалось перепланировать шаги для {user.email}'
            ))

    def _analyze_assignment(self, assignment, analyze_start, analyze_end, force, stats):
        """
        Анализирует назначение и перепланирует при необходимости
        """
        needs_reschedule = False
        stats['analyzed_assignments'] += 1

        # Проверяем наличие запланированных шагов
        user_steps = UserStepProgress.objects.filter(
            user=assignment.user,
            step__program=assignment.program
        )

        stats['total_steps'] += user_steps.count()

        # Проверяем необходимость перепланирования
        if force:
            # Если задана опция force, перепланируем в любом случае
            needs_reschedule = True
        else:
            # Проверяем наличие шагов без запланированного времени
            unscheduled_steps = user_steps.filter(
                Q(planned_date_start__isnull=True) | Q(
                    planned_date_end__isnull=True)
            )

            if unscheduled_steps.exists():
                needs_reschedule = True
            else:
                # Проверяем наличие конфликтов для этого пользователя
                user_conflicts = SmartSchedulerEngine.detect_conflicts(
                    user_id=assignment.user.id,
                    start_date=analyze_start,
                    end_date=analyze_end
                )

                if user_conflicts:
                    needs_reschedule = True
                else:
                    # Проверяем наличие изменений в зависимостях
                    dependency_changes = False
                    for step in user_steps:
                        # Проверяем завершенные предпосылки
                        dependencies = ScheduleConstraint.objects.filter(
                            dependent_step=step.step,
                            constraint_type=ScheduleConstraint.ConstraintType.DEPENDENCY
                        )

                        for dependency in dependencies:
                            if dependency.prerequisite_step:
                                try:
                                    prereq_progress = UserStepProgress.objects.get(
                                        user=assignment.user,
                                        step=dependency.prerequisite_step
                                    )

                                    # Если предпосылка завершена недавно, требуется перепланирование
                                    if prereq_progress.status == UserStepProgress.ProgressStatus.DONE:
                                        if prereq_progress.completed_at and prereq_progress.completed_at > (timezone.now() - timedelta(days=1)):
                                            dependency_changes = True
                                            break
                                except UserStepProgress.DoesNotExist:
                                    pass

                        if dependency_changes:
                            break

                    if dependency_changes:
                        needs_reschedule = True

        # Выполняем перепланирование при необходимости
        if needs_reschedule:
            self._reschedule_assignment(assignment, force, stats)
        else:
            self.stdout.write(
                f'Назначение {assignment.id} не требует перепланирования')
