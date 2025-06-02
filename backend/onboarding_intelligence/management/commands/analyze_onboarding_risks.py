from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging

from departments.models import Department
from onboarding_intelligence.services import OnboardingRiskAnalyzerService

User = get_user_model()

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Анализирует риски онбординга для всех активных пользователей или указанных'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=int,
            help='ID пользователя для анализа рисков'
        )
        parser.add_argument(
            '--department',
            type=int,
            help='ID департамента для анализа рисков'
        )

    def handle(self, *args, **options):
        start_time = timezone.now()
        self.stdout.write(f'Начало анализа рисков онбординга: {start_time}')

        user_id = options.get('user')
        department_id = options.get('department')

        try:
            if user_id:
                # Анализируем риски для конкретного пользователя
                user = User.objects.get(id=user_id)
                self.stdout.write(
                    f'Анализ рисков для пользователя {user.email}')
                OnboardingRiskAnalyzerService.analyze_user_risks(user=user)
                self.stdout.write(self.style.SUCCESS(
                    f'Риски успешно проанализированы для {user.email}'))
            elif department_id:
                # Анализируем риски для конкретного департамента
                department = Department.objects.get(id=department_id)
                self.stdout.write(
                    f'Анализ рисков для департамента {department.name}')
                OnboardingRiskAnalyzerService.analyze_user_risks(
                    department=department)
                self.stdout.write(self.style.SUCCESS(
                    f'Риски успешно проанализированы для департамента {department.name}'))
            else:
                # Анализируем риски для всех пользователей
                self.stdout.write(
                    'Анализ рисков для всех активных пользователей')
                OnboardingRiskAnalyzerService.analyze_user_risks(
                    all_users=True)
                self.stdout.write(self.style.SUCCESS(
                    'Риски успешно проанализированы для всех пользователей'))

        except User.DoesNotExist:
            raise CommandError(f'Пользователь с ID {user_id} не существует')
        except Department.DoesNotExist:
            raise CommandError(
                f'Департамент с ID {department_id} не существует')
        except Exception as e:
            logger.exception('Ошибка при анализе рисков: %s', str(e))
            raise CommandError(f'Ошибка при анализе рисков: {str(e)}')

        end_time = timezone.now()
        execution_time = end_time - start_time
        self.stdout.write(f'Завершение анализа рисков: {end_time}')
        self.stdout.write(f'Время выполнения: {execution_time}')
