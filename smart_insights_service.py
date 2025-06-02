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
