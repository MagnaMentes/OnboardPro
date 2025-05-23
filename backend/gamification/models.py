from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class UserLevel(models.Model):
    """
    Модель для хранения уровня и очков пользователя
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="gamification_level",
        verbose_name=_("user")
    )
    level = models.PositiveIntegerField(_("level"), default=1)
    points = models.PositiveIntegerField(_("points"), default=0)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("user level")
        verbose_name_plural = _("user levels")

    def __str__(self):
        return f"{self.user.email} - Level {self.level}"

    @property
    def points_to_next_level(self):
        """
        Количество очков, необходимое для следующего уровня
        Формула: 100 * уровень^1.5
        """
        return int(100 * (self.level ** 1.5))


class UserReward(models.Model):
    """
    Модель для хранения наград пользователя (достижений и уровней)
    """
    class RewardType(models.TextChoices):
        ACHIEVEMENT = "achievement", _("Achievement")
        LEVEL = "level", _("Level")
        SPECIAL = "special", _("Special")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rewards",
        verbose_name=_("user")
    )
    achievement_id = models.CharField(_("achievement ID"), max_length=50)
    title = models.CharField(_("title"), max_length=255)
    reward_type = models.CharField(
        _("reward type"),
        max_length=20,
        choices=RewardType.choices
    )
    description = models.TextField(_("description"))
    icon = models.CharField(_("icon"), max_length=100, blank=True, null=True)
    awarded_at = models.DateTimeField(_("awarded at"), default=timezone.now)

    class Meta:
        verbose_name = _("user reward")
        verbose_name_plural = _("user rewards")
        unique_together = ["user", "achievement_id"]

    def __str__(self):
        return f"{self.user.email} - {self.title}"
