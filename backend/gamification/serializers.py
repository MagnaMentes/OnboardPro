from rest_framework import serializers
from .models import UserLevel, UserReward


class UserLevelSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели UserLevel
    """
    class Meta:
        model = UserLevel
        fields = ["level", "points", "points_to_next_level"]
        read_only_fields = fields


class UserRewardSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели UserReward
    """
    class Meta:
        model = UserReward
        fields = ["id", "title", "description",
                  "icon", "reward_type", "awarded_at"]
        read_only_fields = fields


class GamificationEventSerializer(serializers.Serializer):
    """
    Сериализатор для событий геймификации
    """
    EVENT_TYPES = [
        "step_completed",
        "feedback_submitted",
        "test_completed",
        "achievement_unlocked"
    ]

    event_type = serializers.ChoiceField(choices=EVENT_TYPES)
    metadata = serializers.JSONField(required=False)
