from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class FeedbackTemplate(models.Model):
    """
    Модель для шаблонов обратной связи
    """
    class TemplateType(models.TextChoices):
        AUTOMATIC = 'automatic', _('Automatic')
        MANUAL = 'manual', _('Manual')

    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    type = models.CharField(
        _('type'),
        max_length=20,
        choices=TemplateType.choices,
        default=TemplateType.MANUAL
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_feedback_templates',
        null=True,
        blank=True,
        verbose_name=_('creator')
    )
    is_anonymous = models.BooleanField(_('is anonymous'), default=False)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('feedback template')
        verbose_name_plural = _('feedback templates')
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class FeedbackQuestion(models.Model):
    """
    Модель для вопросов обратной связи
    """
    class QuestionType(models.TextChoices):
        SCALE = 'scale', _('Scale')
        TEXT = 'text', _('Text')
        MULTIPLE_CHOICE = 'multiple_choice', _('Multiple Choice')

    template = models.ForeignKey(
        FeedbackTemplate,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name=_('template')
    )
    text = models.TextField(_('text'))
    type = models.CharField(
        _('type'),
        max_length=20,
        choices=QuestionType.choices,
        default=QuestionType.TEXT
    )
    order = models.PositiveIntegerField(_('order'), default=0)
    required = models.BooleanField(_('required'), default=True)
    options = models.JSONField(_('options'), blank=True, null=True)

    class Meta:
        verbose_name = _('feedback question')
        verbose_name_plural = _('feedback questions')
        ordering = ['template', 'order']

    def __str__(self):
        return f"{self.template.title} - {self.text[:50]}"


class UserFeedback(models.Model):
    """
    Модель для записи обратной связи по пользователю
    """
    template = models.ForeignKey(
        FeedbackTemplate,
        on_delete=models.CASCADE,
        related_name='user_feedbacks',
        verbose_name=_('template')
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        verbose_name=_('user')
    )
    submitter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='submitted_feedbacks',
        null=True,
        blank=True,
        verbose_name=_('submitter')
    )
    onboarding_step = models.ForeignKey(
        'onboarding.OnboardingStep',
        on_delete=models.SET_NULL,
        related_name='user_feedbacks',
        null=True,
        blank=True,
        verbose_name=_('onboarding step')
    )
    is_anonymous = models.BooleanField(_('is anonymous'), default=False)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('user feedback')
        verbose_name_plural = _('user feedbacks')
        ordering = ['-created_at']

    def __str__(self):
        if self.is_anonymous:
            return f"Anonymous - {self.template.title}"
        return f"{self.user.email} - {self.template.title}"


class FeedbackAnswer(models.Model):
    """
    Модель для ответов на вопросы обратной связи
    """
    feedback = models.ForeignKey(
        UserFeedback,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name=_('feedback')
    )
    question = models.ForeignKey(
        FeedbackQuestion,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name=_('question')
    )
    text_answer = models.TextField(_('text answer'), blank=True)
    scale_answer = models.IntegerField(
        _('scale answer'), null=True, blank=True)
    choice_answer = models.JSONField(_('choice answer'), null=True, blank=True)

    class Meta:
        verbose_name = _('feedback answer')
        verbose_name_plural = _('feedback answers')
        unique_together = ['feedback', 'question']

    def __str__(self):
        return f"{self.feedback} - Q: {self.question.text[:30]}"


class FeedbackInsight(models.Model):
    """
    Модель для AI-анализа обратной связи
    """
    class InsightType(models.TextChoices):
        PROBLEM_AREA = 'problem_area', _('Problem Area')
        SUMMARY = 'summary', _('Summary')
        RISK = 'risk', _('Risk')
        SATISFACTION = 'satisfaction', _('Satisfaction Index')

    feedback = models.ForeignKey(
        UserFeedback,
        on_delete=models.CASCADE,
        related_name='insights',
        verbose_name=_('feedback'),
        null=True,
        blank=True
    )
    template = models.ForeignKey(
        FeedbackTemplate,
        on_delete=models.CASCADE,
        related_name='insights',
        verbose_name=_('template'),
        null=True,
        blank=True
    )
    type = models.CharField(
        _('type'),
        max_length=20,
        choices=InsightType.choices,
        default=InsightType.SUMMARY
    )
    content = models.TextField(_('content'))
    confidence_score = models.FloatField(_('confidence score'), default=0.0)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('feedback insight')
        verbose_name_plural = _('feedback insights')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()} - {self.content[:50]}"
