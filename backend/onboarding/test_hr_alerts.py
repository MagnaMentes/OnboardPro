from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta

from users.models import User, UserRole
from onboarding.models import OnboardingProgram, OnboardingStep, UserOnboardingAssignment
from onboarding.feedback_models import StepFeedback
from onboarding.services.smart_feedback import SmartFeedbackService
from notifications.models import Notification


class HRAlertSystemTest(TestCase):
    """
    Тесты для системы оповещения HR о негативных отзывах
    """

    def setUp(self):
        """
        Настройка данных для тестов
        """
        # Создаем пользователей разных ролей
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            username="admin",
            password="password",
            role=UserRole.ADMIN,
            full_name="Admin User"
        )

        self.hr_user = User.objects.create_user(
            email="hr@test.com",
            username="hr",
            password="password",
            role=UserRole.HR,
            full_name="HR User"
        )

        self.employee = User.objects.create_user(
            email="employee@test.com",
            username="employee",
            password="password",
            role=UserRole.EMPLOYEE,
            full_name="Regular Employee"
        )

        # Создаем программу онбординга
        self.program = OnboardingProgram.objects.create(
            name="Test Program",
            description="Test Program Description",
            author=self.hr_user
        )

        # Создаем шаг программы
        self.step = OnboardingStep.objects.create(
            name="Test Step",
            description="Test Step Description",
            program=self.program,
            order=1
        )

        # Назначаем программу сотруднику
        self.assignment = UserOnboardingAssignment.objects.create(
            user=self.employee,
            program=self.program
        )

    def test_negative_feedback_notification_creation(self):
        """
        Тест создания уведомления при негативном отзыве
        """
        # Создаем негативный отзыв
        negative_feedback = StepFeedback.objects.create(
            user=self.employee,
            step=self.step,
            assignment=self.assignment,
            comment="Это очень непонятная инструкция",
            auto_tag="negative",
            sentiment_score=-0.6
        )

        # Вызываем метод для создания уведомлений
        notifications = SmartFeedbackService.notify_hr_on_negative_feedback(
            negative_feedback)

        # Проверяем, что созданы уведомления для HR и Admin
        self.assertEqual(len(notifications), 2)

        # Проверяем, что уведомления связаны с негативным отзывом
        content_type = ContentType.objects.get_for_model(negative_feedback)
        db_notifications = Notification.objects.filter(
            content_type=content_type,
            object_id=negative_feedback.id
        )
        self.assertEqual(db_notifications.count(), 2)

        # Проверяем текст уведомления
        hr_notification = db_notifications.get(recipient=self.hr_user)
        self.assertEqual(hr_notification.title,
                         "Негативный отзыв от сотрудника")
        self.assertIn(negative_feedback.user.get_full_name(),
                      hr_notification.message)
        self.assertIn(negative_feedback.step.name, hr_notification.message)
        self.assertIn(negative_feedback.assignment.program.name,
                      hr_notification.message)

    def test_neutral_feedback_no_notification(self):
        """
        Тест, что нейтральный отзыв не создает уведомлений
        """
        # Создаем нейтральный отзыв
        neutral_feedback = StepFeedback.objects.create(
            user=self.employee,
            step=self.step,
            assignment=self.assignment,
            comment="Нормальная инструкция",
            auto_tag="neutral",
            sentiment_score=0.1
        )

        # Вызываем метод для создания уведомлений
        notifications = SmartFeedbackService.notify_hr_on_negative_feedback(
            neutral_feedback)

        # Проверяем, что уведомления не созданы
        self.assertEqual(len(notifications), 0)

        # Проверяем, что нет уведомлений в БД
        content_type = ContentType.objects.get_for_model(neutral_feedback)
        db_notifications = Notification.objects.filter(
            content_type=content_type,
            object_id=neutral_feedback.id
        )
        self.assertEqual(db_notifications.count(), 0)

    def test_notification_created_only_once(self):
        """
        Тест, что уведомление создается только один раз для одного отзыва
        """
        # Создаем негативный отзыв
        negative_feedback = StepFeedback.objects.create(
            user=self.employee,
            step=self.step,
            assignment=self.assignment,
            comment="Очень плохая инструкция",
            auto_tag="negative",
            sentiment_score=-0.8
        )

        # Вызываем метод для создания уведомлений дважды
        notifications1 = SmartFeedbackService.notify_hr_on_negative_feedback(
            negative_feedback)
        notifications2 = SmartFeedbackService.notify_hr_on_negative_feedback(
            negative_feedback)

        # Проверяем, что уведомление было создано только один раз для каждого получателя
        content_type = ContentType.objects.get_for_model(negative_feedback)
        db_notifications = Notification.objects.filter(
            content_type=content_type,
            object_id=negative_feedback.id
        )
        # Один для HR, один для Admin
        self.assertEqual(db_notifications.count(), 2)

        # Должны получить те же уведомления при повторном вызове, а не создать новые
        self.assertEqual(len(notifications1), 2)
        self.assertEqual(len(notifications2), 2)

        # Проверяем, что объекты уведомлений в обоих случаях одинаковы
        self.assertEqual(set(n.id for n in notifications1),
                         set(n.id for n in notifications2))
