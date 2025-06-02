import logging
from django.core.management.base import BaseCommand
from ai_insights.recommendation_engine_v2 import AIRecommendationEngineV2

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Генерирует AI-рекомендации v2 для всех пользователей'

    def handle(self, *args, **options):
        self.stdout.write('Начинаем генерацию AI-рекомендаций v2...')

        try:
            count = AIRecommendationEngineV2.generate_all_recommendations()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Успешно сгенерировано {count} рекомендаций')
            )
        except Exception as e:
            logger.error(f"Ошибка при генерации рекомендаций: {e}")
            self.stderr.write(
                self.style.ERROR(f'Произошла ошибка: {e}')
            )
