import logging
from django.core.management.base import BaseCommand
from ai_insights.smart_insights_service import SmartInsightsAggregatorService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Агрегирует инсайты из всех доступных модулей в Smart Insights Hub'

    def handle(self, *args, **options):
        self.stdout.write('Начинаем сбор и агрегацию инсайтов...')

        try:
            count = SmartInsightsAggregatorService.aggregate_all_insights()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Успешно собрано и обработано {count} инсайтов')
            )
        except Exception as e:
            logger.error(f"Ошибка при агрегации инсайтов: {e}")
            self.stderr.write(
                self.style.ERROR(f'Произошла ошибка: {e}')
            )
