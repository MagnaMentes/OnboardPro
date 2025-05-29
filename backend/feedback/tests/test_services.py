from django.test import TestCase
from django.contrib.auth import get_user_model
from feedback.models import (
    FeedbackTemplate, FeedbackQuestion, UserFeedback,
    FeedbackAnswer, FeedbackInsight
)
from feedback.services.ai_insights_service import FeedbackAIInsightsService

User = get_user_model()


class FeedbackAIInsightsServiceTestCase(TestCase):
    """Тестирование сервиса AI-аналитики обратной связи"""

    def setUp(self):
        """Создание тестовых данных для сервиса"""
        # Создание пользователей
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
            title='Тестовый шаблон для сервиса',
            description='Описание тестового шаблона для сервиса AI',
            type=FeedbackTemplate.TemplateType.MANUAL,
            creator=self.admin
        )

        # Создание вопросов
        self.text_question = FeedbackQuestion.objects.create(
            template=self.template,
            text='Опишите ваш опыт онбординга',
            type=FeedbackQuestion.QuestionType.TEXT,
            order=1,
            required=True
        )

        self.scale_question = FeedbackQuestion.objects.create(
            template=self.template,
            text='Оцените процесс онбординга от 1 до 10',
            type=FeedbackQuestion.QuestionType.SCALE,
            order=2,
            required=True
        )

        # Создание обратной связи с положительными отзывами
        self.positive_feedback = UserFeedback.objects.create(
            template=self.template,
            user=self.user,
            submitter=self.admin
        )

        # Положительные ответы
        self.positive_text_answer = FeedbackAnswer.objects.create(
            feedback=self.positive_feedback,
            question=self.text_question,
            text_answer='Онбординг был очень хорошо организован. Все материалы понятные, наставник помогал с вопросами. Я быстро влился в команду и процессы.'
        )

        self.positive_scale_answer = FeedbackAnswer.objects.create(
            feedback=self.positive_feedback,
            question=self.scale_question,
            scale_answer=9
        )

        # Создание обратной связи с негативными отзывами
        self.negative_feedback = UserFeedback.objects.create(
            template=self.template,
            user=self.admin,  # Просто для теста используем другого пользователя
            submitter=self.admin
        )

        # Негативные ответы
        self.negative_text_answer = FeedbackAnswer.objects.create(
            feedback=self.negative_feedback,
            question=self.text_question,
            text_answer='Процесс онбординга был запутанным. Не хватало структурированной документации, много времени потратил на поиск нужной информации. Наставник был часто недоступен.'
        )

        self.negative_scale_answer = FeedbackAnswer.objects.create(
            feedback=self.negative_feedback,
            question=self.scale_question,
            scale_answer=3
        )

        # Инициализация сервиса
        self.insights_service = FeedbackAIInsightsService()

    def test_analyze_text_sentiment_positive(self):
        """Тест анализа тональности позитивного текста"""
        sentiment = self.insights_service.analyze_text_sentiment(
            self.positive_text_answer.text_answer)
        self.assertGreater(sentiment, 0.5)  # Положительная тональность > 0.5

    def test_analyze_text_sentiment_negative(self):
        """Тест анализа тональности негативного текста"""
        sentiment = self.insights_service.analyze_text_sentiment(
            self.negative_text_answer.text_answer)
        self.assertLess(sentiment, 0.5)  # Негативная тональность < 0.5

    def test_identify_problem_areas_positive(self):
        """Тест идентификации проблемных областей в позитивном тексте"""
        problems = self.insights_service.identify_problem_areas(
            self.positive_text_answer.text_answer)
        # Не должно быть проблемных областей
        self.assertEqual(len(problems), 0)

    def test_identify_problem_areas_negative(self):
        """Тест идентификации проблемных областей в негативном тексте"""
        problems = self.insights_service.identify_problem_areas(
            self.negative_text_answer.text_answer)
        self.assertGreater(len(problems), 0)  # Должны быть проблемные области

    def test_detect_risks_positive(self):
        """Тест выявления рисков в позитивном тексте"""
        risks = self.insights_service.detect_risks(
            self.positive_text_answer.text_answer)
        self.assertEqual(len(risks), 0)  # Не должно быть рисков

    def test_detect_risks_negative(self):
        """Тест выявления рисков в негативном тексте"""
        risks = self.insights_service.detect_risks(
            self.negative_text_answer.text_answer)
        self.assertGreater(len(risks), 0)  # Должны быть риски

    def test_calculate_satisfaction_index(self):
        """Тест расчета индекса удовлетворенности"""
        # Для позитивного отзыва
        positive_index = self.insights_service.calculate_satisfaction_index(
            self.positive_text_answer.text_answer,
            self.positive_scale_answer.scale_answer
        )
        # Высокий индекс удовлетворенности
        self.assertGreaterEqual(positive_index, 0.7)

        # Для негативного отзыва
        negative_index = self.insights_service.calculate_satisfaction_index(
            self.negative_text_answer.text_answer,
            self.negative_scale_answer.scale_answer
        )
        # Низкий индекс удовлетворенности
        self.assertLessEqual(negative_index, 0.5)

    def test_generate_feedback_summary(self):
        """Тест генерации сводки по обратной связи"""
        summary = self.insights_service.generate_feedback_summary(
            self.positive_feedback)
        self.assertIn('онбординг', summary.lower())
        self.assertTrue(isinstance(summary, str))
        self.assertGreater(len(summary), 10)

    def test_process_feedback_creates_insights(self):
        """Тест обработки обратной связи и создания инсайтов"""
        # На момент начала теста не должно быть инсайтов
        initial_insights_count = FeedbackInsight.objects.filter(
            feedback=self.positive_feedback).count()

        # Обрабатываем обратную связь
        self.insights_service.process_feedback(self.positive_feedback)

        # Проверяем, что созданы новые инсайты
        final_insights_count = FeedbackInsight.objects.filter(
            feedback=self.positive_feedback).count()
        self.assertGreater(final_insights_count, initial_insights_count)

        # Проверяем типы созданных инсайтов
        insight_types = list(FeedbackInsight.objects.filter(
            feedback=self.positive_feedback
        ).values_list('type', flat=True))

        self.assertIn(FeedbackInsight.InsightType.SUMMARY, insight_types)
        self.assertIn(FeedbackInsight.InsightType.SATISFACTION, insight_types)
