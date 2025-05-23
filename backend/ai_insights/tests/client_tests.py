from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from ai_insights.client_models import ClientAIInsight
from ai_insights.client_services import ClientAISuggestionService
from onboarding.models import OnboardingProgram, OnboardingStep, UserOnboardingAssignment, UserStepProgress

User = get_user_model()


class ClientAIInsightTest(TestCase):
    """
    Тесты для клиентского AI-ассистента
    """

    def setUp(self):
        """
        Настройка тестового окружения
        """
        # Создаем пользователя
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='password123',
            full_name='Test User',
            role='employee'
        )

        # Создаем программу онбординга
        self.program = OnboardingProgram.objects.create(
            name='Test Program',
            description='Test Program Description'
        )

        # Создаем шаг онбординга
        self.step = OnboardingStep.objects.create(
            name='Test Step',
            description='Test Step Description',
            program=self.program,
            order=1,
            step_type='task',
            is_required=True,
            # Добавляем видео URL для тестирования подсказки
            video_url='https://example.com/video.mp4'
        )

        # Создаем назначение онбординга
        self.assignment = UserOnboardingAssignment.objects.create(
            user=self.user,
            program=self.program,
            status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
        )

        # Создаем прогресс по шагу
        self.step_progress = UserStepProgress.objects.create(
            user=self.user,
            step=self.step,
            status='in_progress',
            planned_date_start=timezone.now(),
            # Добавляем дедлайн для тестирования подсказки
            planned_date_end=timezone.now() + timezone.timedelta(days=1)
        )

        # Настраиваем API-клиент
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_generate_suggestion(self):
        """
        Тест создания подсказки для шага
        """
        # Вызываем метод генерации подсказки
        insight = ClientAISuggestionService.generate_suggestion(
            user_id=self.user.id,
            step_id=self.step.id,
            assignment_id=self.assignment.id
        )

        # Проверяем, что подсказка создана
        self.assertIsNotNone(insight)
        self.assertEqual(insight.user, self.user)
        self.assertEqual(insight.step, self.step)
        self.assertEqual(insight.assignment, self.assignment)
        self.assertFalse(insight.dismissed)

        # Проверяем текст подсказки (должен содержать упоминание о видео)
        self.assertIn("видео", insight.hint_text.lower())

    def test_dismiss_suggestion(self):
        """
        Тест скрытия подсказки
        """
        # Создаем подсказку
        insight = ClientAIInsight.objects.create(
            user=self.user,
            step=self.step,
            assignment=self.assignment,
            hint_text='Test hint',
            generated_at=timezone.now(),
            dismissed=False
        )

        # Скрываем подсказку
        success = ClientAISuggestionService.dismiss_suggestion(insight.id)

        # Проверяем, что подсказка скрыта
        self.assertTrue(success)
        insight.refresh_from_db()
        self.assertTrue(insight.dismissed)

    def test_get_active_suggestions(self):
        """
        Тест получения активных подсказок
        """
        # Создаем две подсказки: активную и скрытую
        active_insight = ClientAIInsight.objects.create(
            user=self.user,
            step=self.step,
            assignment=self.assignment,
            hint_text='Active hint',
            generated_at=timezone.now(),
            dismissed=False
        )

        dismissed_insight = ClientAIInsight.objects.create(
            user=self.user,
            step=self.step,
            assignment=self.assignment,
            hint_text='Dismissed hint',
            generated_at=timezone.now(),
            dismissed=True
        )

        # Получаем активные подсказки
        active_insights = ClientAISuggestionService.get_active_suggestions(
            self.user.id)

        # Проверяем, что возвращается только активная подсказка
        self.assertEqual(active_insights.count(), 1)
        self.assertEqual(active_insights.first().id, active_insight.id)

    def test_create_hint_text(self):
        """
        Тест создания текста подсказки
        """
        # Вызываем метод создания текста подсказки
        hint_text = ClientAISuggestionService._create_hint_text(
            user_id=self.user.id,
            step_id=self.step.id,
            assignment_id=self.assignment.id
        )

        # Проверяем, что текст подсказки создан и содержит ожидаемую информацию
        self.assertIsNotNone(hint_text)
        self.assertIn("видео", hint_text.lower())

    def test_api_insights_list(self):
        """
        Тест API для получения списка подсказок
        """
        # Создаем подсказку
        ClientAIInsight.objects.create(
            user=self.user,
            step=self.step,
            assignment=self.assignment,
            hint_text='API Test hint',
            generated_at=timezone.now(),
            dismissed=False
        )

        # Делаем запрос к API
        response = self.client.get('/api/assistant/insights/')

        # Проверяем успешный ответ и наличие подсказки в результате
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['hint_text'], 'API Test hint')

    def test_api_dismiss_insight(self):
        """
        Тест API для скрытия подсказки
        """
        # Создаем подсказку
        insight = ClientAIInsight.objects.create(
            user=self.user,
            step=self.step,
            assignment=self.assignment,
            hint_text='Dismiss API Test hint',
            generated_at=timezone.now(),
            dismissed=False
        )

        # Делаем запрос к API для скрытия подсказки
        response = self.client.post(
            f'/api/assistant/insights/{insight.id}/dismiss/')

        # Проверяем успешный ответ
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Проверяем, что подсказка скрыта в БД
        insight.refresh_from_db()
        self.assertTrue(insight.dismissed)

    def test_api_generate_insight(self):
        """
        Тест API для генерации подсказки для шага
        """
        # Делаем запрос к API для генерации подсказки
        response = self.client.get(
            f'/api/assistant/step/{self.step.id}/insight/')

        # Проверяем успешный ответ
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('hint_text', response.data)
        self.assertIn('id', response.data)

        # Проверяем, что подсказка создана в БД
        insight_id = response.data['id']
        insight = ClientAIInsight.objects.get(id=insight_id)
        self.assertEqual(insight.user, self.user)
        self.assertEqual(insight.step, self.step)
