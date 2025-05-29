from django.test import TestCase
from django.contrib.auth import get_user_model
from feedback.models import (
    FeedbackTemplate, FeedbackQuestion, UserFeedback,
    FeedbackAnswer, FeedbackInsight
)
from django.utils import timezone

User = get_user_model()


class FeedbackModelsTestCase(TestCase):
    """Тестирование моделей системы обратной связи"""

    def setUp(self):
        """Создание тестовых данных"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            first_name='Тест',
            last_name='Пользователь'
        )

        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            first_name='Админ',
            last_name='Пользователь',
            is_staff=True
        )

        # Создание шаблона обратной связи
        self.template = FeedbackTemplate.objects.create(
            title='Тестовый шаблон',
            description='Описание тестового шаблона',
            type=FeedbackTemplate.TemplateType.MANUAL,
            creator=self.admin,
            is_anonymous=False
        )

        # Создание вопросов
        self.question_text = FeedbackQuestion.objects.create(
            template=self.template,
            text='Текстовый вопрос',
            type=FeedbackQuestion.QuestionType.TEXT,
            order=1,
            required=True
        )

        self.question_scale = FeedbackQuestion.objects.create(
            template=self.template,
            text='Шкала от 1 до 10',
            type=FeedbackQuestion.QuestionType.SCALE,
            order=2,
            required=True
        )

        self.question_choice = FeedbackQuestion.objects.create(
            template=self.template,
            text='Выбор вариантов',
            type=FeedbackQuestion.QuestionType.MULTIPLE_CHOICE,
            order=3,
            required=False,
            options=['Вариант 1', 'Вариант 2', 'Вариант 3']
        )

        # Создание записи обратной связи
        self.user_feedback = UserFeedback.objects.create(
            template=self.template,
            user=self.user,
            submitter=self.admin,
            is_anonymous=False
        )

        # Создание ответов
        self.text_answer = FeedbackAnswer.objects.create(
            feedback=self.user_feedback,
            question=self.question_text,
            text_answer='Тестовый ответ на текстовый вопрос'
        )

        self.scale_answer = FeedbackAnswer.objects.create(
            feedback=self.user_feedback,
            question=self.question_scale,
            scale_answer=8
        )

        self.choice_answer = FeedbackAnswer.objects.create(
            feedback=self.user_feedback,
            question=self.question_choice,
            choice_answer=['Вариант 1', 'Вариант 3']
        )

        # Создание инсайта
        self.insight = FeedbackInsight.objects.create(
            feedback=self.user_feedback,
            type=FeedbackInsight.InsightType.SUMMARY,
            content='Тестовый инсайт для обратной связи',
            confidence_score=0.85
        )

    def test_feedback_template_creation(self):
        """Тест создания шаблона обратной связи"""
        self.assertEqual(self.template.title, 'Тестовый шаблон')
        self.assertEqual(self.template.type,
                         FeedbackTemplate.TemplateType.MANUAL)
        self.assertEqual(self.template.creator, self.admin)
        self.assertFalse(self.template.is_anonymous)
        self.assertIsNotNone(self.template.created_at)

    def test_feedback_questions_creation(self):
        """Тест создания вопросов обратной связи"""
        self.assertEqual(self.question_text.text, 'Текстовый вопрос')
        self.assertEqual(self.question_text.type,
                         FeedbackQuestion.QuestionType.TEXT)
        self.assertTrue(self.question_text.required)

        self.assertEqual(self.question_scale.text, 'Шкала от 1 до 10')
        self.assertEqual(self.question_scale.type,
                         FeedbackQuestion.QuestionType.SCALE)

        self.assertEqual(self.question_choice.text, 'Выбор вариантов')
        self.assertEqual(self.question_choice.type,
                         FeedbackQuestion.QuestionType.MULTIPLE_CHOICE)
        self.assertEqual(len(self.question_choice.options), 3)
        self.assertIn('Вариант 2', self.question_choice.options)

    def test_user_feedback_creation(self):
        """Тест создания записи обратной связи пользователя"""
        self.assertEqual(self.user_feedback.template, self.template)
        self.assertEqual(self.user_feedback.user, self.user)
        self.assertEqual(self.user_feedback.submitter, self.admin)
        self.assertFalse(self.user_feedback.is_anonymous)

    def test_feedback_answers_creation(self):
        """Тест создания ответов на вопросы"""
        self.assertEqual(self.text_answer.feedback, self.user_feedback)
        self.assertEqual(self.text_answer.question, self.question_text)
        self.assertEqual(self.text_answer.text_answer,
                         'Тестовый ответ на текстовый вопрос')

        self.assertEqual(self.scale_answer.question, self.question_scale)
        self.assertEqual(self.scale_answer.scale_answer, 8)

        self.assertEqual(self.choice_answer.question, self.question_choice)
        self.assertEqual(len(self.choice_answer.choice_answer), 2)
        self.assertIn('Вариант 1', self.choice_answer.choice_answer)

    def test_feedback_insight_creation(self):
        """Тест создания инсайта на основе обратной связи"""
        self.assertEqual(self.insight.feedback, self.user_feedback)
        self.assertEqual(self.insight.type,
                         FeedbackInsight.InsightType.SUMMARY)
        self.assertEqual(self.insight.content,
                         'Тестовый инсайт для обратной связи')
        self.assertEqual(self.insight.confidence_score, 0.85)

    def test_feedback_template_string_representation(self):
        """Тест строкового представления шаблона"""
        self.assertEqual(str(self.template), 'Тестовый шаблон')

    def test_feedback_question_string_representation(self):
        """Тест строкового представления вопроса"""
        self.assertEqual(str(self.question_text),
                         'Тестовый шаблон - Текстовый вопрос')

    def test_user_feedback_string_representation(self):
        """Тест строкового представления обратной связи"""
        self.assertEqual(str(self.user_feedback),
                         'test@example.com - Тестовый шаблон')

    def test_anonymous_user_feedback_string_representation(self):
        """Тест строкового представления анонимной обратной связи"""
        anon_feedback = UserFeedback.objects.create(
            template=self.template,
            user=self.user,
            is_anonymous=True
        )
        self.assertEqual(str(anon_feedback), 'Anonymous - Тестовый шаблон')
