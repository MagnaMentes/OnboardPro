from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from feedback.models import (
    FeedbackTemplate, FeedbackQuestion, UserFeedback,
    FeedbackAnswer, FeedbackInsight
)
import json

User = get_user_model()


class FeedbackApiTestCase(TestCase):
    """Тестирование API системы обратной связи"""

    def setUp(self):
        """Создание тестовых данных для API"""
        self.client = APIClient()

        # Создание пользователей
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            first_name='Админ',
            last_name='Пользователь',
            is_staff=True
        )

        self.regular_user = User.objects.create_user(
            email='user@example.com',
            password='user123',
            first_name='Обычный',
            last_name='Пользователь'
        )

        # Создание шаблона обратной связи
        self.template = FeedbackTemplate.objects.create(
            title='Тестовый шаблон API',
            description='Описание тестового шаблона для API',
            type=FeedbackTemplate.TemplateType.MANUAL,
            creator=self.admin_user
        )

        # Создание вопросов
        self.text_question = FeedbackQuestion.objects.create(
            template=self.template,
            text='API текстовый вопрос',
            type=FeedbackQuestion.QuestionType.TEXT,
            order=1,
            required=True
        )

        self.scale_question = FeedbackQuestion.objects.create(
            template=self.template,
            text='API шкала от 1 до 10',
            type=FeedbackQuestion.QuestionType.SCALE,
            order=2,
            required=True
        )

        # Создание обратной связи
        self.user_feedback = UserFeedback.objects.create(
            template=self.template,
            user=self.regular_user,
            submitter=self.admin_user
        )

        # Создание ответов
        self.text_answer = FeedbackAnswer.objects.create(
            feedback=self.user_feedback,
            question=self.text_question,
            text_answer='API тестовый ответ'
        )

        self.scale_answer = FeedbackAnswer.objects.create(
            feedback=self.user_feedback,
            question=self.scale_question,
            scale_answer=7
        )

        # Создание инсайта
        self.insight = FeedbackInsight.objects.create(
            feedback=self.user_feedback,
            type=FeedbackInsight.InsightType.SUMMARY,
            content='API тестовый инсайт',
            confidence_score=0.82
        )

    def test_get_templates_list_authenticated(self):
        """Тест получения списка шаблонов для авторизованного пользователя"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('feedback-templates-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Тестовый шаблон API')

    def test_get_templates_list_unauthenticated(self):
        """Тест получения списка шаблонов для неавторизованного пользователя"""
        response = self.client.get(reverse('feedback-templates-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_template_detail(self):
        """Тест получения детальной информации о шаблоне"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            reverse('feedback-template-detail', kwargs={'pk': self.template.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Тестовый шаблон API')
        self.assertEqual(len(response.data['questions']), 2)

    def test_create_template(self):
        """Тест создания нового шаблона"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'title': 'Новый шаблон',
            'description': 'Описание нового шаблона',
            'type': FeedbackTemplate.TemplateType.MANUAL,
            'is_anonymous': True,
            'questions': [
                {
                    'text': 'Новый вопрос',
                    'type': FeedbackQuestion.QuestionType.TEXT,
                    'order': 1,
                    'required': True
                }
            ]
        }
        response = self.client.post(
            reverse('feedback-templates-list'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Новый шаблон')
        self.assertEqual(response.data['creator_id'], self.admin_user.id)
        self.assertEqual(len(response.data['questions']), 1)

    def test_send_feedback(self):
        """Тест отправки обратной связи"""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'template_id': self.template.id,
            'user_id': self.regular_user.id,
            'answers': [
                {
                    'question_id': self.text_question.id,
                    'text_answer': 'Новый тестовый ответ'
                },
                {
                    'question_id': self.scale_question.id,
                    'scale_answer': 9
                }
            ]
        }
        response = self.client.post(
            reverse('feedback-send'),
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['template_id'], self.template.id)
        self.assertEqual(response.data['user_id'], self.regular_user.id)
        self.assertEqual(response.data['submitter_id'], self.admin_user.id)
        self.assertEqual(len(response.data['answers']), 2)

    def test_get_user_feedback_results(self):
        """Тест получения результатов обратной связи по пользователю"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            reverse('user-feedback-results',
                    kwargs={'user_id': self.regular_user.id})
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['template']
                         ['title'], 'Тестовый шаблон API')
        self.assertEqual(len(response.data[0]['answers']), 2)

    def test_get_feedback_insights(self):
        """Тест получения AI-инсайтов обратной связи"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(reverse('feedback-insights'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        insights = response.data.get('insights', [])
        self.assertGreaterEqual(len(insights), 1)
        self.assertEqual(insights[0]['content'], 'API тестовый инсайт')

    def test_unauthorized_access_to_insights(self):
        """Тест доступа к инсайтам неавторизованным пользователем"""
        response = self.client.get(reverse('feedback-insights'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
