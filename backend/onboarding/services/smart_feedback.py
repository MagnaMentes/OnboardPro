from textblob import TextBlob
import re
from django.contrib.contenttypes.models import ContentType
from notifications.services import NotificationService
from notifications.models import NotificationType
from users.models import User, UserRole


class SmartFeedbackService:
    """
    Сервис для анализа отзывов и автоматического определения тональности и тегов
    """

    @staticmethod
    def analyze_feedback(text):
        """
        Анализирует текст отзыва и возвращает оценку тональности и автоматический тег.

        Args:
            text (str): Текст комментария

        Returns:
            tuple: (auto_tag, sentiment_score)
        """
        # Убедимся что текст не None
        if not text:
            return 'neutral', 0.0

        # Используем TextBlob для анализа тональности текста
        blob = TextBlob(text.lower())
        sentiment_score = blob.sentiment.polarity

        # Определение auto_tag на основе ключевых слов и sentiment_score
        auto_tag = SmartFeedbackService._determine_auto_tag(
            text.lower(), sentiment_score)

        return auto_tag, sentiment_score

    @staticmethod
    def _determine_auto_tag(text, sentiment_score):
        """
        Определяет автоматический тег на основе ключевых слов и оценки тональности

        Args:
            text (str): Текст комментария (в нижнем регистре)
            sentiment_score (float): Оценка тональности от -1 до 1

        Returns:
            str: Автоматический тег
        """
        # Ключевые слова для каждой категории
        unclear_instruction_keywords = [
            'непонятно', 'неясно', 'запутанно', 'сложно понять', 'нечетко',
            'не ясно', 'не разобрался', 'неточная инструкция', 'что делать',
            'как это работает', 'не понимаю', 'объясните', 'нет инструкции'
        ]

        delay_warning_keywords = [
            'задержка', 'опоздание', 'долго', 'медленно', 'затянуто',
            'не успеваю', 'не успею', 'не укладываюсь', 'сроки поджимают',
            'не хватает времени', 'слишком быстро', 'тороплюсь'
        ]

        # Проверка на соответствие ключевым словам
        for keyword in unclear_instruction_keywords:
            if keyword in text:
                return 'unclear_instruction'

        for keyword in delay_warning_keywords:
            if keyword in text:
                return 'delay_warning'

        # Если нет специальных ключевых слов, используем оценку тональности
        if sentiment_score >= 0.2:
            return 'positive'
        elif sentiment_score <= -0.2:
            return 'negative'
        else:
            return 'neutral'

    @staticmethod
    def notify_hr_on_negative_feedback(step_feedback):
        """
        Уведомляет HR и Admin пользователей о негативной обратной связи

        Args:
            step_feedback: Объект StepFeedback с негативным отзывом

        Returns:
            list: Список созданных уведомлений
        """
        # Проверяем, соответствует ли фидбэк критериям для уведомления
        if (step_feedback.auto_tag in ['negative', 'delay_warning', 'unclear_instruction'] or
                (step_feedback.sentiment_score is not None and step_feedback.sentiment_score < -0.3)):

            # Получаем информацию о программе и пользователе
            user_full_name = step_feedback.user.get_full_name()
            step_name = step_feedback.step.name
            program_name = step_feedback.assignment.program.name

            # Формируем сообщение
            title = "Негативный отзыв от сотрудника"
            message = f"Сотрудник {user_full_name} оставил негативный отзыв по шагу '{step_name}' в программе '{program_name}'"

            # Получаем всех HR и Admin пользователей
            hr_admin_users = User.objects.filter(
                role__in=[UserRole.HR, UserRole.ADMIN])

            notifications = []

            # Проверяем, не было ли уже создано уведомление для этого фидбэка
            content_type = ContentType.objects.get_for_model(step_feedback)
            existing_notifications = list(NotificationService.get_notifications_by_content_object(
                content_type=content_type,
                object_id=step_feedback.id
            ))

            # Если уведомления уже есть, возвращаем их
            if existing_notifications:
                return existing_notifications

            # Создаем уведомления для каждого HR и Admin
            for user in hr_admin_users:
                notification = NotificationService.send_notification(
                    recipient=user,
                    title=title,
                    message=message,
                    notification_type=NotificationType.WARNING,
                    content_object=step_feedback
                )
                notifications.append(notification)

            return notifications

        return []
