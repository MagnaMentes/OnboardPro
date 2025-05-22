from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class FeedbackMood(models.Model):
    """
    Модель для настроения пользователя по назначенной программе
    """
    class MoodValue(models.TextChoices):
        GREAT = 'great', _('Great')
        GOOD = 'good', _('Good')
        NEUTRAL = 'neutral', _('Neutral')
        BAD = 'bad', _('Bad')
        TERRIBLE = 'terrible', _('Terrible')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedback_moods',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        'onboarding.UserOnboardingAssignment',
        on_delete=models.CASCADE,
        related_name='moods',
        verbose_name=_('assignment')
    )
    value = models.CharField(
        _('value'),
        max_length=20,
        choices=MoodValue.choices,
    )
    comment = models.TextField(_('comment'), blank=True)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('feedback mood')
        verbose_name_plural = _('feedback moods')
        ordering = ['-created_at']
        # Ограничение проверяется на уровне сериализатора,
        # так как Django ORM не поддерживает непосредственно ограничения по date части DateTimeField

    def __str__(self):
        return f"{self.user.email} - {self.assignment.program.name} - {self.get_value_display()}"


class StepFeedback(models.Model):
    """
    Модель для отзыва пользователя о конкретном шаге онбординга
    """
    class AutoTagChoices(models.TextChoices):
        POSITIVE = 'positive', _('Positive')
        NEUTRAL = 'neutral', _('Neutral')
        NEGATIVE = 'negative', _('Negative')
        UNCLEAR_INSTRUCTION = 'unclear_instruction', _('Unclear Instruction')
        DELAY_WARNING = 'delay_warning', _('Delay Warning')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='step_feedbacks',
        verbose_name=_('user')
    )
    step = models.ForeignKey(
        'onboarding.OnboardingStep',
        on_delete=models.CASCADE,
        related_name='feedbacks',
        verbose_name=_('step')
    )
    assignment = models.ForeignKey(
        'onboarding.UserOnboardingAssignment',
        on_delete=models.CASCADE,
        related_name='step_feedbacks',
        verbose_name=_('assignment')
    )
    comment = models.TextField(_('comment'))
    auto_tag = models.CharField(
        _('auto tag'),
        max_length=30,
        choices=AutoTagChoices.choices,
        blank=True,
        null=True
    )
    sentiment_score = models.FloatField(
        _('sentiment score'),
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('step feedback')
        verbose_name_plural = _('step feedbacks')
        ordering = ['-created_at']
        # Ограничение: один комментарий на один шаг (перезаписывает предыдущий)
        unique_together = ['user', 'step', 'assignment']

    def __str__(self):
        return f"{self.user.email} - {self.step.name}"
