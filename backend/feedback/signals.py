from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserFeedback, FeedbackInsight
from .services.ai_insights_service import FeedbackAIInsightsService


@receiver(post_save, sender=UserFeedback)
def create_insights_for_feedback(sender, instance, created, **kwargs):
    """
    Автоматически создает инсайты при создании нового отзыва
    """
    # Запускаем анализ только при создании нового отзыва и если у него нет инсайтов
    if created and not hasattr(instance, '_skip_insights'):
        try:
            # Запускаем анализ асинхронно или в фоновом режиме, если это возможно
            # В данном примере мы используем простой вызов функции
            FeedbackAIInsightsService.analyze_feedback(instance)
        except Exception as e:
            # Логируем ошибку, но не прерываем выполнение
            print(f"Error in auto-generating insights: {e}")
