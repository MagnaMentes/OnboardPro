from django.core.management.base import BaseCommand
from django.utils import timezone
from ai_insights.training_insights_service import TrainingInsightsService
from users.models import User
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Запускает анализ данных обучения и создает AI-инсайты'

    def add_arguments(self, parser):
        parser.add_argument(
            '--update-metrics',
            action='store_true',
            help='Обновить метрики пользователей вместе с анализом',
        )

    def handle(self, *args, **options):
        start_time = timezone.now()
        self.stdout.write(f"Запуск анализа данных обучения ({start_time})")

        # Запускаем все методы анализа
        insights_count = TrainingInsightsService.run_all_analysis()
        self.stdout.write(self.style.SUCCESS(
            f"✅ Создано инсайтов: {insights_count}"))

        # Если указана опция обновления метрик
        if options['update_metrics']:
            self.stdout.write("Обновление метрик обучения пользователей...")

            # Обновляем метрики для всех пользователей с активными заданиями
            users_with_assignments = User.objects.filter(
                onboarding_assignments__status='active'
            ).distinct()

            users_updated = 0
            for user in users_with_assignments:
                try:
                    TrainingInsightsService.calculate_user_metrics(user)
                    users_updated += 1
                    if users_updated % 10 == 0:
                        self.stdout.write(
                            f"Обработано пользователей: {users_updated}")
                except Exception as e:
                    logger.error(
                        f"Ошибка при обновлении метрик для пользователя {user.id}: {str(e)}")

            self.stdout.write(self.style.SUCCESS(
                f"✅ Обновлены метрики для {users_updated} пользователей"))

            # Обновляем индексы скорости обучения
            self.stdout.write("Расчет индексов скорости обучения...")
            TrainingInsightsService.calculate_learning_speed_indices()
            self.stdout.write(self.style.SUCCESS(
                "✅ Индексы скорости обучения обновлены"))

        end_time = timezone.now()
        execution_time = (end_time - start_time).total_seconds()
        self.stdout.write(
            self.style.SUCCESS(
                f"Анализ завершен за {execution_time:.2f} секунд ({end_time})"
            )
        )
