from django.core.management.base import BaseCommand
from core.services.hr_dashboard import HRDashboardAggregatorService


class Command(BaseCommand):
    help = 'Создает снэпшот текущих HR-метрик'

    def handle(self, *args, **options):
        self.stdout.write('Начало создания снэпшота HR-метрик...')

        try:
            HRDashboardAggregatorService.store_current_snapshot()
            self.stdout.write(
                self.style.SUCCESS('Снэпшот HR-метрик успешно создан')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Ошибка при создании снэпшота: {str(e)}')
            )
