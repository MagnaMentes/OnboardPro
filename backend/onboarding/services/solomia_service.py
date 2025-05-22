"""
Сервис для работы с AI-ассистентом Solomia
"""
from django.shortcuts import get_object_or_404

from ..models import UserStepProgress, AIHint
from ..feedback_models import StepFeedback


class SolomiaService:
    """
    Сервисный класс для AI-ассистента Solomia
    """

    @classmethod
    def generate_hint_for_step(cls, user_step_id: int) -> str:
        """
        Генерирует AI-подсказку для конкретного шага онбординга

        Args:
            user_step_id: ID записи UserStepProgress

        Returns:
            str: Сгенерированная подсказка
        """
        # Получаем информацию о шаге
        user_step = get_object_or_404(UserStepProgress, id=user_step_id)

        # Собираем описание текущего шага
        step_description = f"Шаг: {user_step.step.name}\n{user_step.step.description}"
        step_type = user_step.step.get_step_type_display()

        # Собираем фидбэк по предыдущим шагам (только для шагов с меньшим порядковым номером)
        previous_steps = UserStepProgress.objects.filter(
            user=user_step.user,
            step__program=user_step.step.program,
            step__order__lt=user_step.step.order
        ).select_related('step')

        feedback_context = ""
        for prev_step in previous_steps:
            feedbacks = StepFeedback.objects.filter(step_progress=prev_step)
            if feedbacks.exists():
                feedback_context += f"\nПо шагу '{prev_step.step.name}' был получен отзыв:\n"
                for feedback in feedbacks:
                    feedback_context += f"- {feedback.text}\n"

        # В реальной системе здесь будет запрос к AI API
        # Сейчас просто генерируем заглушку
        generated_text = cls._fake_ai_response(
            step_description, step_type, feedback_context)

        # Сохраняем сгенерированную подсказку
        hint = AIHint.objects.create(
            assignment_step=user_step,
            generated_hint=generated_text
        )

        return generated_text

    @staticmethod
    def _fake_ai_response(step_description: str, step_type: str, feedback_context: str) -> str:
        """
        Временная заглушка для имитации ответа от AI

        Args:
            step_description: Описание текущего шага
            step_type: Тип шага (задача, встреча, обучение)
            feedback_context: Собранный фидбэк по предыдущим шагам

        Returns:
            str: Псевдо-AI текст
        """
        if step_type == "Задача":
            return (
                f"AI подсказывает: Судя по описанию, вам предстоит выполнить задачу. "
                f"Рекомендую разбить её на подзадачи и выполнять последовательно. "
                f"Не стесняйтесь обратиться к своему руководителю, если возникнут вопросы."
            )
        elif step_type == "Встреча":
            return (
                f"AI подсказывает: Вам предстоит важная встреча. "
                f"Рекомендую подготовить заранее вопросы и темы для обсуждения. "
                f"Запишите ключевые моменты во время встречи для дальнейшего использования."
            )
        elif step_type == "Обучение":
            return (
                f"AI подсказывает: Для эффективного обучения рекомендую выделить "
                f"достаточное время без отвлечений. Делайте заметки и задавайте вопросы "
                f"при необходимости. После обучения попробуйте применить новые знания на практике."
            )
        else:
            return (
                f"AI подсказывает: Внимательно ознакомьтесь с описанием шага и "
                f"следуйте инструкциям. Если что-то непонятно, обратитесь к менеджеру "
                f"или наставнику за помощью."
            )

    @classmethod
    def get_latest_hint(cls, user_step_id: int) -> str:
        """
        Получает последнюю сгенерированную подсказку для шага

        Args:
            user_step_id: ID записи UserStepProgress

        Returns:
            str: Текст последней подсказки или None, если подсказок нет
        """
        user_step = get_object_or_404(UserStepProgress, id=user_step_id)

        hint = AIHint.objects.filter(
            assignment_step=user_step).order_by('-created_at').first()

        if hint:
            return hint.generated_hint

        return None
