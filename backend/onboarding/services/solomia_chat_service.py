"""
Сервис для работы с AI-чатом Solomia
"""
from typing import List, Dict, Optional, Any
from django.shortcuts import get_object_or_404
from django.utils import timezone

from ..models import UserStepProgress
from ..solomia_models import AIChatMessage


class SolomiaChatService:
    """
    Сервисный класс для AI-чата Solomia
    """

    @classmethod
    def generate_reply(cls, user_id: int, step_id: int, message: str) -> str:
        """
        Генерирует ответ от AI на основе истории сообщений и шагов.

        Args:
            user_id: ID пользователя
            step_id: ID шага (UserStepProgress)
            message: Текст сообщения от пользователя

        Returns:
            str: Сгенерированный ответ
        """
        # Получаем информацию о шаге
        user_step = get_object_or_404(
            UserStepProgress, id=step_id, user__id=user_id)

        # Сохраняем сообщение пользователя
        user_message = AIChatMessage.objects.create(
            user_id=user_id,
            role=AIChatMessage.Role.HUMAN,
            message=message,
            step_progress=user_step,
            created_at=timezone.now()
        )

        # Получаем историю чата для этого шага
        chat_history = cls.get_chat_history(user_id, step_id)

        # В реальной системе здесь будет запрос к AI API (OpenAI, OpenRouter и т.д.)
        # Сейчас просто генерируем заглушку
        reply = cls._fake_ai_response(user_step, message, chat_history)

        # Сохраняем ответ AI
        ai_message = AIChatMessage.objects.create(
            user_id=user_id,
            role=AIChatMessage.Role.ASSISTANT,
            message=reply,
            step_progress=user_step,
            created_at=timezone.now()
        )

        return reply

    @staticmethod
    def _fake_ai_response(user_step: UserStepProgress, message: str, chat_history: List[Dict[str, Any]]) -> str:
        """
        Временная заглушка для имитации ответа от AI

        Args:
            user_step: Объект шага пользователя
            message: Текст сообщения от пользователя
            chat_history: История сообщений

        Returns:
            str: Псевдо-AI текст
        """
        step_type = user_step.step.get_step_type_display()
        step_name = user_step.step.name

        # Базовые ответы в зависимости от типа шага и запроса
        if "привет" in message.lower() or "здравствуй" in message.lower():
            return (
                f"Привет! Я Solomia, ваш AI-ассистент по онбордингу. "
                f"Я помогу вам с выполнением текущего шага: \"{step_name}\". "
                f"Что именно вас интересует?"
            )
        elif "что делать" in message.lower() or "как выполнить" in message.lower():
            if step_type == "Задача":
                return (
                    f"Для выполнения задачи \"{step_name}\" рекомендую сначала внимательно прочитать описание. "
                    f"Затем разбейте задачу на подзадачи и решайте их последовательно. "
                    f"Если у вас возникнут конкретные вопросы, я постараюсь на них ответить."
                )
            elif step_type == "Встреча":
                return (
                    f"Для подготовки к встрече \"{step_name}\" советую: "
                    f"1. Познакомиться с участниками встречи заранее\n"
                    f"2. Подготовить вопросы, которые хотите задать\n"
                    f"3. Ознакомиться с материалами, если они были предоставлены\n"
                    f"Что-то еще интересует?"
                )
            elif step_type == "Обучение":
                return (
                    f"Для успешного прохождения обучения \"{step_name}\" я рекомендую: "
                    f"1. Выделить достаточно времени без отвлечений\n"
                    f"2. Делать заметки по ходу обучения\n"
                    f"3. Задавать вопросы, если что-то непонятно\n"
                    f"4. После обучения применить знания на практике\n"
                    f"Могу я чем-то еще помочь?"
                )
        elif "спасибо" in message.lower():
            return "Рад был помочь! Если у вас возникнут еще вопросы, обращайтесь."
        else:
            # Общий ответ для других случаев
            return (
                f"Я понимаю, что вас интересует информация о шаге \"{step_name}\". "
                f"Можете задать более конкретный вопрос, чтобы я мог лучше помочь? "
                f"Например, спросите меня о том, как лучше всего выполнить этот шаг, "
                f"или какие материалы могут быть полезны."
            )

    @classmethod
    def get_chat_history(cls, user_id: int, step_id: int, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Получает историю чата для конкретного шага и пользователя

        Args:
            user_id: ID пользователя
            step_id: ID шага (UserStepProgress)
            limit: Ограничение на количество сообщений (опционально)

        Returns:
            List[Dict[str, Any]]: Список сообщений
        """
        # Получаем последние сообщения, если указан лимит
        query = AIChatMessage.objects.filter(
            user_id=user_id, step_progress_id=step_id)

        if limit:
            query = query.order_by('-created_at')[:limit]
            # Возвращаем в правильном порядке (от старых к новым)
            query = reversed(list(query))
        else:
            query = query.order_by('created_at')

        # Преобразуем в список словарей для удобства
        chat_history = []
        for msg in query:
            chat_history.append({
                'id': msg.id,
                'role': msg.role,
                'message': msg.message,
                'created_at': msg.created_at.isoformat()
            })

        return chat_history
