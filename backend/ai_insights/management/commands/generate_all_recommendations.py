from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from ai_insights.services import AIRecommendationService

User = get_user_model()


class Command(BaseCommand):
    help = 'Генерирует AI-рекомендации для всех пользователей'

    def handle(self, *args, **options):
        users = User.objects.all()
        total_users = users.count()
        success_count = 0

        for user in users:
            try:
                AIRecommendationService.generate_recommendations(user)
                success_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'Успешно сгенерированы рекомендации для пользователя {user.email}'
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'Ошибка при генерации рекомендаций для пользователя {user.email}: {str(e)}'
                ))

        self.stdout.write(self.style.SUCCESS(
            f'Рекомендации успешно сгенерированы для {success_count} из {total_users} пользователей'
        ))
