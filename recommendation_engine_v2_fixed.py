from users.models import User
from onboarding.feedback_models import FeedbackMood, StepFeedback
from onboarding.models import UserStepProgress
from .models import AIRecommendation
import logging
from django.db.models import Count, Q
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from langchain_community.embeddings.openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

from .recommendations_models import AIRecommendationV2
from .insights_models import AIInsightV2, InsightTag

logger = logging.getLogger(__name__)


class AIRecommendationEngineV2:
    """
    Улучшенная версия движка рекомендаций с использованием векторного анализа и машинного обучения
    """

    def __init__(self):
        self.openai_api_key = settings.OPENAI_API_KEY
        self.embeddings = OpenAIEmbeddings(openai_api_key=self.openai_api_key)

    def generate_recommendations(self, user):
        """
        Генерирует рекомендации для пользователя на основе его прогресса и обратной связи
        """
        try:
            # Получаем данные о пользователе
            user_steps = UserStepProgress.objects.filter(user=user)
            user_feedback = StepFeedback.objects.filter(user=user)

            # Анализируем прогресс пользователя
            slow_steps = user_steps.filter(
                completion_time__gt=timezone.timedelta(days=3),
                status='completed'
            )

            # Анализируем обратную связь
            negative_feedback = user_feedback.filter(
                mood__in=[FeedbackMood.CONFUSED, FeedbackMood.FRUSTRATED]
            )

            recommendations = []

            # Формируем рекомендации на основе медленного прогресса
            if slow_steps.exists():
                for step in slow_steps:
                    recommendation = AIRecommendationV2.objects.create(
                        user=user,
                        title=f"Рекомендация по шагу: {step.step.title}",
                        content=f"Мы заметили, что вы потратили больше времени на шаг '{step.step.title}'. "
                        f"Рекомендуем обратить внимание на дополнительные материалы и возможно "
                        f"запросить помощь у наставника.",
                        recommendation_type="PROGRESS_IMPROVEMENT",
                        priority="MEDIUM"
                    )
                    recommendations.append(recommendation)

            # Формируем рекомендации на основе негативной обратной связи
            if negative_feedback.exists():
                for feedback in negative_feedback:
                    recommendation = AIRecommendationV2.objects.create(
                        user=user,
                        title=f"Рекомендация по обратной связи: {feedback.step.title}",
                        content=f"Мы заметили, что у вас возникли трудности с шагом '{feedback.step.title}'. "
                        f"Рекомендуем посмотреть дополнительное видео по этой теме или "
                        f"записаться на консультацию с экспертом.",
                        recommendation_type="EXPERIENCE_IMPROVEMENT",
                        priority="HIGH"
                    )
                    recommendations.append(recommendation)

            return recommendations

        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []

    @staticmethod
    def get_recommendations_for_user(user, limit=5):
        """
        Получает последние рекомендации для пользователя
        """
        try:
            return AIRecommendationV2.objects.filter(user=user).order_by('-created_at')[:limit]
        except Exception as e:
            logger.error(f"Error getting recommendations for user: {e}")
            return []
