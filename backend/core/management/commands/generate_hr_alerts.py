from django.core.management.base import BaseCommand
from core.services.hr_dashboard import HRDashboardAggregatorService, HRRealTimeAlertService


class Command(BaseCommand):
    help = 'Проверяет правила HR-алертов и создает новые алерты при необходимости'

    def add_arguments(self, parser):
        parser.add_argument(
            '--store-metrics',
            action='store_true',
            help='Сохранить текущие метрики в базу данных'
        )

    def handle(self, *args, **options):
        self.stdout.write('Начало проверки правил HR-алертов...')

        # Сохраняем снэпшот метрик, если указан флаг
        if options['store_metrics']:
            self.stdout.write('Сохранение текущих метрик...')
            HRDashboardAggregatorService.store_current_snapshot()
            self.stdout.write(
                self.style.SUCCESS('Метрики успешно сохранены')
            )

        # Проверяем правила и создаем алерты
        try:
            HRRealTimeAlertService.check_alert_rules()
            self.stdout.write(
                self.style.SUCCESS(
                    'Проверка правил HR-алертов завершена успешно')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Ошибка при проверке правил: {str(e)}')
            )
