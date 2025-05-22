from textblob import TextBlob
import re


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
