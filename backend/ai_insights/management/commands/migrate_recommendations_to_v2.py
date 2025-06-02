import logging
from django.core.management.base import BaseCommand
from ai_insights.recommendation_engine_v2 import AIRecommendationEngineV2

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Мигрирует старые AI-рекомендации в новый формат v2'

    def handle(self, *args, **options):
        self.stdout.write('Начинаем миграцию AI-рекомендаций в формат v2...')

        try:
            count = AIRecommendationEngineV2.migrate_old_recommendations()
            self.stdout.write(
                self.style.SUCCESS(f'Успешно мигрировано {count} рекомендаций')
            )
        except Exception as e:
            logger.error(f"Ошибка при миграции рекомендаций: {e}")
            self.stderr.write(
                self.style.ERROR(f'Произошла ошибка: {e}')
            )
