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
