from scheduler.ai_services import SmartPrioritizationEngine as SchedulerAIInsightsService
from feedback.services.ai_insights_service import FeedbackAIInsightsService
from .training_insights_service import TrainingInsightsService
from .services import AIInsightService
from .recommendations_models import AIRecommendationV2
import logging
from django.db.models import Count, Q
from django.utils import timezone
from django.conf import settings
from langchain_community.embeddings.openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from sklearn.cluster import KMeans
import numpy as np

from .insights_models import AIInsightV2, InsightTag

logger = logging.getLogger(__name__)


class SmartInsightsAggregatorService:
    """
    Сервис для агрегации всех инсайтов из разных модулей системы
    """

    @staticmethod
    def aggregate_all_insights():
        """
        Агрегирует все инсайты из различных модулей системы
        """
        try:
            insights_count = 0

            # Получаем инсайты из сервиса планирования
            scheduler_insights = SchedulerAIInsightsService.analyze_all()
            if scheduler_insights:
                insights_count += len(scheduler_insights)
                logger.info(
                    f"Aggregated {len(scheduler_insights)} insights from scheduler")

            # Получаем инсайты из сервиса обратной связи
            feedback_insights = FeedbackAIInsightsService.analyze_all_feedback()
            if feedback_insights:
                insights_count += len(feedback_insights)
                logger.info(
                    f"Aggregated {len(feedback_insights)} insights from feedback")

            # Получаем инсайты из сервиса обучения
            training_insights_count = TrainingInsightsService.analyze_all()
            if training_insights_count:
                insights_count += training_insights_count
                logger.info(
                    f"Aggregated {training_insights_count} insights from training")

            return insights_count
        except Exception as e:
            logger.error(
                f"Error in SmartInsightsAggregatorService.aggregate_all_insights: {e}")
            return 0
