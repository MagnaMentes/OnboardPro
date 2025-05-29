from django.core.management.base import BaseCommand
from feedback.models import UserFeedback, FeedbackTemplate
from feedback.services.ai_insights_service import FeedbackAIInsightsService


class Command(BaseCommand):
    help = 'Run AI analysis on feedback data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Analyze all feedbacks, including already analyzed ones',
        )

    def handle(self, *args, **options):
        analyze_all = options['all']
        self.stdout.write('Starting AI feedback analysis...')

        # Анализ индивидуальных отзывов
        if analyze_all:
            # Анализируем все отзывы
            feedbacks = UserFeedback.objects.all()
            self.stdout.write(
                f'Found {feedbacks.count()} total feedback records to analyze')
        else:
            # Анализируем только отзывы без инсайтов
            feedbacks = UserFeedback.objects.filter(insights__isnull=True)
            self.stdout.write(
                f'Found {feedbacks.count()} new feedback records to analyze')

        for feedback in feedbacks:
            self.stdout.write(
                f'Analyzing feedback #{feedback.id} from {feedback.user.email}')
            insights = FeedbackAIInsightsService.analyze_feedback(feedback)
            self.stdout.write(
                f'Created {len(insights)} insights for feedback #{feedback.id}')

        # Анализ агрегированных данных по шаблонам
        templates = FeedbackTemplate.objects.all()
        self.stdout.write(
            f'Found {templates.count()} feedback templates for aggregated analysis')

        for template in templates:
            self.stdout.write(
                f'Analyzing aggregated data for template "{template.title}"')
            insights = FeedbackAIInsightsService.analyze_template_feedback(
                template)
            self.stdout.write(
                f'Created {len(insights)} aggregated insights for template "{template.title}"')

        self.stdout.write(self.style.SUCCESS(
            'AI feedback analysis completed successfully!'))
