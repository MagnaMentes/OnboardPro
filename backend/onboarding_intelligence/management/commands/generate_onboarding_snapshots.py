from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging

from departments.models import Department
from onboarding_intelligence.services import OnboardingProgressAggregatorService

User = get_user_model()

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Генерирует снимки прогресса онбординга для всех активных пользователей или указанных'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=int,
            help='ID пользователя для генерации снимка прогресса'
        )
        parser.add_argument(
            '--department',
            type=int,
            help='ID департамента для генерации снимков прогресса'
        )
        parser.add_argument(
            '--summaries',
            action='store_true',
            help='Также сгенерировать сводки по департаментам'
        )

    def handle(self, *args, **options):
        start_time = timezone.now()
        self.stdout.write(
            f'Начало генерации снимков прогресса онбординга: {start_time}')

        user_id = options.get('user')
        department_id = options.get('department')
        generate_summaries = options.get('summaries')

        try:
            if user_id:
                # Генерируем снимок для конкретного пользователя
                user = User.objects.get(id=user_id)
                self.stdout.write(
                    f'Генерация снимка прогресса для пользователя {user.email}')
                OnboardingProgressAggregatorService.generate_user_snapshots(
                    user=user)
                self.stdout.write(self.style.SUCCESS(
                    f'Снимок прогресса успешно сгенерирован для {user.email}'))
            elif department_id:
                # Генерируем снимки для конкретного департамента
                department = Department.objects.get(id=department_id)
                self.stdout.write(
                    f'Генерация снимков прогресса для департамента {department.name}')
                OnboardingProgressAggregatorService.generate_user_snapshots(
                    department=department)
                self.stdout.write(self.style.SUCCESS(
                    f'Снимки прогресса успешно сгенерированы для департамента {department.name}'))

                if generate_summaries:
                    self.stdout.write(
                        f'Генерация сводки для департамента {department.name}')
                    OnboardingProgressAggregatorService.generate_department_summaries()
                    self.stdout.write(self.style.SUCCESS(
                        f'Сводка успешно сгенерирована для департамента {department.name}'))
            else:
                # Генерируем снимки для всех пользователей
                self.stdout.write(
                    'Генерация снимков прогресса для всех активных пользователей')
                OnboardingProgressAggregatorService.generate_user_snapshots(
                    all_users=True)
                self.stdout.write(self.style.SUCCESS(
                    'Снимки прогресса успешно сгенерированы для всех пользователей'))

                if generate_summaries:
                    self.stdout.write(
                        'Генерация сводок для всех департаментов')
                    OnboardingProgressAggregatorService.generate_department_summaries()
                    self.stdout.write(self.style.SUCCESS(
                        'Сводки успешно сгенерированы для всех департаментов'))

        except User.DoesNotExist:
            raise CommandError(f'Пользователь с ID {user_id} не существует')
        except Department.DoesNotExist:
            raise CommandError(
                f'Департамент с ID {department_id} не существует')
        except Exception as e:
            logger.exception(
                'Ошибка при генерации снимков прогресса: %s', str(e))
            raise CommandError(
                f'Ошибка при генерации снимков прогресса: {str(e)}')

        end_time = timezone.now()
        execution_time = end_time - start_time
        self.stdout.write(
            f'Завершение генерации снимков прогресса: {end_time}')
        self.stdout.write(f'Время выполнения: {execution_time}')
