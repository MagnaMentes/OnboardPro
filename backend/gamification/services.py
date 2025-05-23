from django.db import transaction
from django.utils import timezone
from .models import UserLevel, UserReward


class GamificationService:
    """
    Сервисный класс для управления геймификацией
    """
    POINTS_CONFIG = {
        "step_completion": 10,
        "test_completion": 15,
        "feedback_submission": 5,
    }

    LEVEL_THRESHOLDS = {
        1: 0,
        2: 100,
        3: 250,
        4: 500,
        5: 1000,
    }

    KEY_ACHIEVEMENTS = {
        "first_step": {
            "title": "Первый шаг",
            "description": "Завершил первый шаг онбординга",
            "icon": "first_step"
        },
        "perfect_test": {
            "title": "Идеальный тест",
            "description": "Получил 100% за тест",
            "icon": "perfect_test"
        },
        "feedback_king": {
            "title": "Король фидбека",
            "description": "Оставил 10 отзывов",
            "icon": "feedback_king"
        }
    }

    @staticmethod
    def get_or_create_user_level(user):
        """
        Получает или создает запись об уровне пользователя
        """
        return UserLevel.objects.get_or_create(
            user=user,
            defaults={"level": 1, "points": 0}
        )[0]

    @staticmethod
    def handle_step_completion(user, step):
        """
        Обработка завершения шага онбординга
        Возвращает: (user_level, points)
        """
        # Начисляем очки за выполнение шага
        points = GamificationService.POINTS_CONFIG["step_completion"]
        if step.is_required:
            points *= 2  # Удвоенные очки за обязательный шаг

        # Проверяем, первый ли это шаг пользователя
        if not UserReward.objects.filter(
            user=user,
            achievement_id="first_step"
        ).exists():
            achievement = GamificationService.KEY_ACHIEVEMENTS["first_step"]
            GamificationService.award_achievement(
                user,
                "first_step",
                achievement["title"],
                achievement["description"],
                achievement["icon"]
            )

        user_level = GamificationService.add_points(user, points)
        return user_level, points

    @staticmethod
    def handle_feedback_submission(user, feedback):
        """
        Обработка отправки фидбека
        Args:
            user: Пользователь, отправивший фидбек
            feedback: Объект StepFeedback
        """
        # Начисляем очки за отправку фидбека
        user_level, points = GamificationService.add_points(
            user, 'feedback_submission', 1)

        # Проверяем количество отзывов для получения достижения
        feedback_count = user.step_feedbacks.count()
        if feedback_count >= 10:  # Используем >= вместо == для надежности
            GamificationService.award_achievement(user, 'feedback_king')

        return user_level, points

    @staticmethod
    def handle_test_completion(user, test_result):
        """
        Обработка завершения теста
        Возвращает: (user_level, points)
        """
        # Начисляем очки за прохождение теста
        user_level, points = GamificationService.add_points(
            user, 'test_completion', 1)

        # Если тест пройден идеально, выдаем достижение
        if test_result.score == test_result.max_score:
            GamificationService.award_achievement(user, 'perfect_test')

        return user_level, points

    @staticmethod
    @transaction.atomic
    def add_points(user, points, points_type=None):  # points_type для обратной совместимости
        """
        Начисление очков пользователю с проверкой повышения уровня
        Возвращает: user_level
        """
        if isinstance(points, str) and points in GamificationService.POINTS_CONFIG:
            points = GamificationService.POINTS_CONFIG[points]

        user_level = GamificationService.get_or_create_user_level(user)
        old_level = user_level.level

        user_level.points += points

        # Проверяем повышение уровня
        for level, threshold in sorted(GamificationService.LEVEL_THRESHOLDS.items(), reverse=True):
            if user_level.points >= threshold and user_level.level < level:
                user_level.level = level
                # Вызываем award_level_up при повышении уровня
                if level > old_level:
                    GamificationService.award_level_up(user, level, old_level)
                break

        user_level.save()
        return user_level

    @staticmethod
    def award_achievement(user, achievement_id, title, description, icon=None):
        """
        Выдача достижения пользователю
        Возвращает: (reward, created)
        """
        reward, created = UserReward.objects.get_or_create(
            user=user,
            achievement_id=achievement_id,
            defaults={
                "title": title,
                "description": description,
                "icon": icon or achievement_id,
                "reward_type": UserReward.RewardType.ACHIEVEMENT
            }
        )
        return reward, created

    @staticmethod
    def award_level_up(user, new_level, old_level):
        """
        Выдача награды за повышение уровня
        Возвращает: reward
        """
        achievement_id = f"level_{new_level}"
        title = f"Уровень {new_level}"
        description = f"Достиг уровня {new_level} (был {old_level})"
        icon = f"level_{new_level}"

        reward, _ = UserReward.objects.get_or_create(
            user=user,
            achievement_id=achievement_id,
            defaults={
                "title": title,
                "description": description,
                "icon": icon,
                "reward_type": UserReward.RewardType.LEVEL
            }
        )
        return reward

    @staticmethod
    def handle_event(user, event_type, metadata=None):
        """
        Обработка произвольного события геймификации
        Возвращает: user_level
        """
        metadata = metadata or {}
        if event_type == "step_completed":
            level, _ = GamificationService.handle_step_completion(
                user, metadata.get("step"))
            return level
        elif event_type == "feedback_submitted":
            level, _ = GamificationService.handle_feedback_submission(
                user, metadata.get("feedback"))
            return level
        elif event_type == "test_completed":
            level, _ = GamificationService.handle_test_completion(
                user, metadata.get("test_result"))
            return level
        elif event_type == "achievement_unlocked":
            reward = GamificationService.award_achievement(
                user,
                metadata.get("achievement_id"),
                metadata.get("title"),
                metadata.get("description"),
                metadata.get("icon")
            )[0]
            return reward
