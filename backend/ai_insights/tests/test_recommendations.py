from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from ai_insights.models import AIRecommendation
from ai_insights.services import AIRecommendationService
from onboarding.models import OnboardingProgram, OnboardingStep, UserOnboardingAssignment, UserStepProgress
from onboarding.feedback_models import FeedbackMood, StepFeedback

User = get_user_model()


class RecommendationServiceTestCase(TestCase):
    def setUp(self):
        # Создаем пользователя
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            role='employee'
        )

        # Создаем HR-пользователя
        self.hr_user = User.objects.create_user(
            email='hr@example.com',
            password='password123',
            role='hr'
        )

        # Создаем программу онбординга
        self.program = OnboardingProgram.objects.create(
            name='Test Program',
            description='Test Description',
            author=self.hr_user
        )

        # Создаем шаг онбординга
        self.step = OnboardingStep.objects.create(
            name='Test Step',
            program=self.program,
            order=1,
            is_required=True
        )

        # Назначаем программу пользователю
        self.assignment = UserOnboardingAssignment.objects.create(
            user=self.user,
            program=self.program,
            status='active'
        )

        # Создаем прогресс по шагу
        self.step_progress = UserStepProgress.objects.create(
            user=self.user,
            step=self.step,
            status='not_started',
            planned_date_start=timezone.now() - timedelta(days=30),
            planned_date_end=timezone.now() - timedelta(days=15)
        )

    def test_generate_recommendations_for_overdue_steps(self):
        # Проверяем, что рекомендации генерируются для просроченных шагов
        AIRecommendationService.generate_recommendations(self.user)

        # Должна быть создана рекомендация о просроченных шагах
        recommendations = AIRecommendation.objects.filter(
            user=self.user,
            dismissed=False
        )

        self.assertEqual(recommendations.count(), 1)
        self.assertIn('просроченные шаги',
                      recommendations.first().recommendation_text.lower())

    def test_generate_recommendations_for_low_mood(self):
        # Создаем запись о плохом настроении
        mood = FeedbackMood.objects.create(
            user=self.user,
            assignment=self.assignment,
            value='terrible'
        )

        # Генерируем рекомендации
        AIRecommendationService.generate_recommendations(self.user)

        # Должна быть создана рекомендация о низком тонусе
        recommendations = AIRecommendation.objects.filter(
            user=self.user,
            dismissed=False
        )

        # Должно быть 2 рекомендации (просроченный шаг + низкий тонус)
        self.assertEqual(recommendations.count(), 2)
        mood_rec = recommendations.filter(
            recommendation_text__icontains='тонус').first()
        self.assertIsNotNone(mood_rec)

    def test_dismiss_recommendation(self):
        # Создаем рекомендацию
        recommendation = AIRecommendation.objects.create(
            user=self.user,
            assignment=self.assignment,
            recommendation_text='Test recommendation',
            generated_at=timezone.now()
        )

        # Скрываем рекомендацию
        result = AIRecommendationService.dismiss_recommendation(
            recommendation.id)

        # Проверяем результат
        self.assertTrue(result)
        recommendation.refresh_from_db()
        self.assertTrue(recommendation.dismissed)
