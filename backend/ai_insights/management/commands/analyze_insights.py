from django.core.management.base import BaseCommand
from onboarding.models import UserOnboardingAssignment
from ai_insights.services import AIInsightService


class Command(BaseCommand):
    help = 'Анализирует все активные назначения онбординга для выявления рисков'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user_id',
            type=int,
            help='ID пользователя для анализа (опционально)',
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')

        # Фильтруем активные назначения онбординга
        assignments = UserOnboardingAssignment.objects.filter(status='active')

        # Если указан user_id, фильтруем по пользователю
        if user_id:
            assignments = assignments.filter(user_id=user_id)

        # Выполняем анализ для каждого назначения
        total_assignments = assignments.count()
        self.stdout.write(
            f'Найдено {total_assignments} активных назначений онбординга')

        insights_created = 0
        for assignment in assignments:
            try:
                AIInsightService.analyze_onboarding_progress(assignment)
                insights_created += 1
                self.stdout.write(
                    f'Проанализировано: {assignment.user.email} - {assignment.program.name}')
            except Exception as e:
                self.stderr.write(
                    f'Ошибка при анализе {assignment.id}: {str(e)}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Успешно создано/обновлено {insights_created} AI-инсайтов')
        )
