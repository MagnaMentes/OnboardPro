from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from .models import OnboardingStep

User = settings.AUTH_USER_MODEL


class LMSModule(models.Model):
    """
    Модель обучающего модуля в LMS
    """
    class ContentType(models.TextChoices):
        VIDEO = 'video', _('Video')
        TEXT = 'text', _('Text')
        FILE = 'file', _('File')

    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    content_type = models.CharField(
        _('content type'),
        max_length=20,
        choices=ContentType.choices
    )
    content = models.TextField(
        _('content'),
        help_text=_('URL видео, текстовое содержимое или путь к файлу')
    )
    order = models.PositiveIntegerField(_('order'))
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='lms_modules',
        verbose_name=_('onboarding step')
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('LMS module')
        verbose_name_plural = _('LMS modules')
        ordering = ['step', 'order']
        unique_together = ['step', 'order']

    def __str__(self):
        return f"{self.step.name} - {self.title}"


class LMSTest(models.Model):
    """
    Модель теста в LMS
    """
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='lms_tests',
        verbose_name=_('onboarding step')
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('LMS test')
        verbose_name_plural = _('LMS tests')
        unique_together = ['step']  # Один тест на шаг

    def __str__(self):
        return f"{self.step.name} - {self.title}"


class LMSQuestion(models.Model):
    """
    Модель вопроса в тесте LMS
    """
    test = models.ForeignKey(
        LMSTest,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name=_('test')
    )
    text = models.TextField(_('question text'))
    order = models.PositiveIntegerField(_('order'), default=0)

    class Meta:
        verbose_name = _('LMS question')
        verbose_name_plural = _('LMS questions')
        ordering = ['test', 'order']

    def __str__(self):
        return f"{self.test.title} - {self.text[:50]}"


class LMSOption(models.Model):
    """
    Модель варианта ответа на вопрос теста LMS
    """
    question = models.ForeignKey(
        LMSQuestion,
        on_delete=models.CASCADE,
        related_name='options',
        verbose_name=_('question')
    )
    text = models.CharField(_('option text'), max_length=255)
    is_correct = models.BooleanField(_('is correct'), default=False)
    order = models.PositiveIntegerField(_('order'), default=0)

    class Meta:
        verbose_name = _('LMS option')
        verbose_name_plural = _('LMS options')
        ordering = ['question', 'order']

    def __str__(self):
        return f"{self.question.text[:30]} - {self.text[:30]}"


class LMSUserAnswer(models.Model):
    """
    Модель ответа пользователя на вопрос теста LMS
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lms_answers',
        verbose_name=_('user')
    )
    question = models.ForeignKey(
        LMSQuestion,
        on_delete=models.CASCADE,
        related_name='user_answers',
        verbose_name=_('question')
    )
    selected_option = models.ForeignKey(
        LMSOption,
        on_delete=models.CASCADE,
        related_name='user_selections',
        verbose_name=_('selected option')
    )
    answered_at = models.DateTimeField(_('answered at'), default=timezone.now)

    class Meta:
        verbose_name = _('LMS user answer')
        verbose_name_plural = _('LMS user answers')
        # Один ответ на вопрос от пользователя
        unique_together = ['user', 'question']

    def __str__(self):
        return f"{self.user} - {self.question.text[:30]} - {self.selected_option.text[:30]}"


class LMSUserTestResult(models.Model):
    """
    Модель результата прохождения теста пользователем
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lms_test_results',
        verbose_name=_('user')
    )
    test = models.ForeignKey(
        LMSTest,
        on_delete=models.CASCADE,
        related_name='user_results',
        verbose_name=_('test')
    )
    is_passed = models.BooleanField(_('is passed'), default=False)
    score = models.PositiveIntegerField(_('score'), default=0)
    max_score = models.PositiveIntegerField(_('max score'), default=0)
    completed_at = models.DateTimeField(
        _('completed at'), default=timezone.now)

    class Meta:
        verbose_name = _('LMS user test result')
        verbose_name_plural = _('LMS user test results')
        # Один результат теста для пользователя
        unique_together = ['user', 'test']

    def __str__(self):
        return f"{self.user} - {self.test.title} - {self.score}/{self.max_score}"
