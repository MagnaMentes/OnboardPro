from django.utils import timezone
from django.db.models import Avg, Count, Q
from .models import AIInsight, RiskLevel
from onboarding.models import UserStepProgress
from onboarding.feedback_models import FeedbackMood, StepFeedback


class AIInsightService:
    """
    Сервисный класс для анализа прогресса онбординга и выявления рисков
    """

    @staticmethod
    def analyze_onboarding_progress(assignment):
        """
        Анализирует прогресс онбординга и создает AI-инсайт

        Args:
            assignment: Объект UserOnboardingAssignment

        Returns:
            AIInsight: Созданный объект инсайта
        """
        risk_level = RiskLevel.LOW
        reasons = []

        # Анализ настроения (moods)
        mood_analysis = AIInsightService._analyze_mood(assignment)
        if mood_analysis["risk_level"] != RiskLevel.LOW:
            risk_level = max(risk_level, mood_analysis["risk_level"])
            reasons.append(mood_analysis["reason"])

        # Анализ прогресса по шагам
        progress_analysis = AIInsightService._analyze_steps_progress(
            assignment)
        if progress_analysis["risk_level"] != RiskLevel.LOW:
            risk_level = max(risk_level, progress_analysis["risk_level"])
            reasons.append(progress_analysis["reason"])

        # Анализ фидбека по шагам
        feedback_analysis = AIInsightService._analyze_step_feedback(assignment)
        if feedback_analysis["risk_level"] != RiskLevel.LOW:
            risk_level = max(risk_level, feedback_analysis["risk_level"])
            reasons.append(feedback_analysis["reason"])

        # Если нет причин для риска, добавляем стандартное сообщение
        if not reasons:
            reasons.append("Онбординг проходит успешно без выявленных рисков.")

        # Создаем или обновляем AI-инсайт
        insight, created = AIInsight.objects.update_or_create(
            user=assignment.user,
            assignment=assignment,
            defaults={
                'risk_level': risk_level,
                'reason': "\n".join(reasons),
                'created_at': timezone.now()
            }
        )

        return insight

    @staticmethod
    def _analyze_mood(assignment):
        """
        Анализирует настроение пользователя
        """
        # Получаем настроение за последние 7 дней
        recent_moods = FeedbackMood.objects.filter(
            assignment=assignment,
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).order_by('-created_at')

        # Если нет настроений, риск низкий
        if not recent_moods.exists():
            return {
                "risk_level": RiskLevel.LOW,
                "reason": "Нет данных о настроении."
            }

        # Подсчитываем количество негативных настроений
        negative_count = recent_moods.filter(
            value__in=['terrible', 'bad']
        ).count()

        # Если более 50% настроений негативные, высокий риск
        if negative_count / recent_moods.count() >= 0.5:
            return {
                "risk_level": RiskLevel.HIGH,
                "reason": "Преобладают негативные настроения в последние 7 дней."
            }

        # Если последнее настроение негативное, средний риск
        if recent_moods.first().value in ['terrible', 'bad']:
            return {
                "risk_level": RiskLevel.MEDIUM,
                "reason": "Последнее зафиксированное настроение негативное."
            }

        return {
            "risk_level": RiskLevel.LOW,
            "reason": "Настроение пользователя в норме."
        }

    @staticmethod
    def _analyze_steps_progress(assignment):
        """
        Анализирует прогресс пользователя по шагам
        """
        # Получаем все шаги программы
        user_steps_progress = UserStepProgress.objects.filter(
            user=assignment.user,
            step__program=assignment.program
        )

        # Если нет шагов, риск низкий
        total_steps = user_steps_progress.count()
        if not total_steps:
            return {
                "risk_level": RiskLevel.LOW,
                "reason": "Нет данных о шагах онбординга."
            }

        # Подсчитываем количество просроченных шагов
        now = timezone.now()
        overdue_steps = user_steps_progress.filter(
            status__in=['not_started', 'in_progress'],
            planned_date_end__lt=now
        )
        overdue_count = overdue_steps.count()

        # Если есть просроченные шаги, оцениваем риск
        if overdue_count > 0:
            overdue_ratio = overdue_count / total_steps

            if overdue_ratio >= 0.3 or overdue_count >= 3:
                return {
                    "risk_level": RiskLevel.HIGH,
                    "reason": f"Просрочено {overdue_count} шагов онбординга ({int(overdue_ratio * 100)}%)."
                }
            else:
                return {
                    "risk_level": RiskLevel.MEDIUM,
                    "reason": f"Просрочено {overdue_count} шагов онбординга."
                }

        # Проверяем процент выполненных шагов
        completed_steps = user_steps_progress.filter(status='done').count()
        completion_ratio = completed_steps / total_steps

        if completion_ratio < 0.2 and total_steps > 3:
            return {
                "risk_level": RiskLevel.MEDIUM,
                "reason": f"Низкий процент выполнения шагов: {int(completion_ratio * 100)}%."
            }

        return {
            "risk_level": RiskLevel.LOW,
            "reason": "Прогресс по шагам в пределах нормы."
        }

    @staticmethod
    def _analyze_step_feedback(assignment):
        """
        Анализирует обратную связь по шагам
        """
        # Получаем отзывы по шагам
        step_feedbacks = StepFeedback.objects.filter(
            assignment=assignment
        )

        # Если нет отзывов, риск низкий
        if not step_feedbacks.exists():
            return {
                "risk_level": RiskLevel.LOW,
                "reason": "Нет данных об отзывах на шаги."
            }

        # Подсчитываем негативные отзывы
        negative_feedbacks = step_feedbacks.filter(
            Q(auto_tag='negative') |
            Q(auto_tag='unclear_instruction') |
            Q(auto_tag='delay_warning') |
            Q(sentiment_score__lt=-0.3)
        )

        negative_count = negative_feedbacks.count()

        # Если негативных отзывов больше 30% или >= 3, высокий риск
        if negative_count > 0:
            negative_ratio = negative_count / step_feedbacks.count()

            if negative_ratio >= 0.3 or negative_count >= 3:
                return {
                    "risk_level": RiskLevel.HIGH,
                    "reason": f"Обнаружено {negative_count} негативных отзывов о шагах."
                }
            else:
                return {
                    "risk_level": RiskLevel.MEDIUM,
                    "reason": f"Обнаружено {negative_count} негативных отзывов о шагах."
                }

        return {
            "risk_level": RiskLevel.LOW,
            "reason": "Обратная связь по шагам в пределах нормы."
        }

    @staticmethod
    def get_insights_for_user(user_id):
        """
        Получает последние инсайты для пользователя
        """
        return AIInsight.objects.filter(
            user_id=user_id
        ).order_by('-created_at')

    @staticmethod
    def get_all_insights():
        """
        Получает все инсайты для всех пользователей
        """
        return AIInsight.objects.all().order_by('-created_at')
