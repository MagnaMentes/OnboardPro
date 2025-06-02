from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging

from departments.models import Department
from onboarding_intelligence.services import AnomalyDetectionService

User = get_user_model()

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Выявляет аномалии в процессе онбординга для всех активных пользователей или указанных'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=int,
            help='ID пользователя для поиска аномалий'
        )
        parser.add_argument(
            '--department',
            type=int,
            help='ID департамента для поиска аномалий'
        )

    def handle(self, *args, **options):
        start_time = timezone.now()
        self.stdout.write(f'Начало поиска аномалий в онбординге: {start_time}')

        user_id = options.get('user')
        department_id = options.get('department')

        try:
            if user_id:
                # Ищем аномалии для конкретного пользователя
                user = User.objects.get(id=user_id)
                self.stdout.write(
                    f'Поиск аномалий для пользователя {user.email}')
                AnomalyDetectionService.detect_anomalies(user=user)
                self.stdout.write(self.style.SUCCESS(
                    f'Поиск аномалий успешно выполнен для {user.email}'))
            elif department_id:
                # Ищем аномалии для конкретного департамента
                department = Department.objects.get(id=department_id)
                self.stdout.write(
                    f'Поиск аномалий для департамента {department.name}')
                AnomalyDetectionService.detect_anomalies(department=department)
                self.stdout.write(self.style.SUCCESS(
                    f'Поиск аномалий успешно выполнен для департамента {department.name}'))
            else:
                # Ищем аномалии для всех пользователей
                self.stdout.write(
                    'Поиск аномалий для всех активных пользователей')
                AnomalyDetectionService.detect_anomalies(all_users=True)
                self.stdout.write(self.style.SUCCESS(
                    'Поиск аномалий успешно выполнен для всех пользователей'))

        except User.DoesNotExist:
            raise CommandError(f'Пользователь с ID {user_id} не существует')
        except Department.DoesNotExist:
            raise CommandError(
                f'Департамент с ID {department_id} не существует')
        except Exception as e:
            logger.exception('Ошибка при поиске аномалий: %s', str(e))
            raise CommandError(f'Ошибка при поиске аномалий: {str(e)}')

        end_time = timezone.now()
        execution_time = end_time - start_time
        self.stdout.write(f'Завершение поиска аномалий: {end_time}')
        self.stdout.write(f'Время выполнения: {execution_time}')
