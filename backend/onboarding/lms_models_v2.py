from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from .models import OnboardingStep
from .lms_models import LMSTest, LMSQuestion, LMSOption

User = settings.AUTH_USER_MODEL


class LearningModule(models.Model):
    """
    Модель учебного модуля - содержит набор уроков
    """
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='learning_modules',
        verbose_name=_('onboarding step')
    )
    order = models.PositiveIntegerField(_('order'), default=0)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_learning_modules',
        verbose_name=_('created by')
    )

    class Meta:
        verbose_name = _('learning module')
        verbose_name_plural = _('learning modules')
        ordering = ['step', 'order']
        unique_together = ['step', 'order']

    def __str__(self):
        return f"{self.step.name} - {self.title}"


class Lesson(models.Model):
    """
    Модель урока - основная единица обучения
    """
    class ContentType(models.TextChoices):
        TEXT = 'text', _('Text')
        VIDEO = 'video', _('Video')
        PRESENTATION = 'presentation', _('Presentation')
        MIXED = 'mixed', _('Mixed content')

    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    content = models.TextField(_('content'))
    content_type = models.CharField(
        _('content type'),
        max_length=20,
        choices=ContentType.choices,
        default=ContentType.TEXT
    )
    module = models.ForeignKey(
        LearningModule,
        on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name=_('learning module')
    )
    order = models.PositiveIntegerField(_('order'), default=0)
    estimated_minutes = models.PositiveIntegerField(
        _('estimated minutes'), default=15)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('lesson')
        verbose_name_plural = _('lessons')
        ordering = ['module', 'order']
        unique_together = ['module', 'order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"


class Attachment(models.Model):
    """
    Модель вложения к уроку - файлы, ссылки, видео и т.д.
    """
    class AttachmentType(models.TextChoices):
        FILE = 'file', _('File')
        LINK = 'link', _('Link')
        VIDEO = 'video', _('Video')
        IMAGE = 'image', _('Image')
        OTHER = 'other', _('Other')

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('lesson')
    )
    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'), blank=True)
    attachment_type = models.CharField(
        _('attachment type'),
        max_length=20,
        choices=AttachmentType.choices
    )
    file_path = models.FileField(
        _('file path'),
        upload_to='learning_attachments/',
        null=True,
        blank=True
    )
    external_url = models.URLField(_('external URL'), blank=True)
    order = models.PositiveIntegerField(_('order'), default=0)
    created_at = models.DateTimeField(_('created at'), default=timezone.now)

    class Meta:
        verbose_name = _('attachment')
        verbose_name_plural = _('attachments')
        ordering = ['lesson', 'order']

    def __str__(self):
        return f"{self.lesson.title} - {self.title}"


class EnhancedLMSQuestion(models.Model):
    """
    Расширенная модель вопроса для тестов с различными типами вопросов
    """
    class QuestionType(models.TextChoices):
        SINGLE_CHOICE = 'single_choice', _('Single choice')
        MULTIPLE_CHOICE = 'multiple_choice', _('Multiple choice')
        OPEN_ANSWER = 'open_answer', _('Open answer')

    test = models.ForeignKey(
        LMSTest,
        on_delete=models.CASCADE,
        related_name='enhanced_questions',
        verbose_name=_('test')
    )
    text = models.TextField(_('question text'))
    question_type = models.CharField(
        _('question type'),
        max_length=20,
        choices=QuestionType.choices,
        default=QuestionType.SINGLE_CHOICE
    )
    order = models.PositiveIntegerField(_('order'), default=0)
    explanation = models.TextField(
        _('explanation'),
        blank=True,
        help_text=_('Пояснение, которое будет показано после ответа на вопрос')
    )

    class Meta:
        verbose_name = _('enhanced LMS question')
        verbose_name_plural = _('enhanced LMS questions')
        ordering = ['test', 'order']

    def __str__(self):
        return f"{self.test.title} - {self.text[:50]}"


class OpenAnswerOption(models.Model):
    """
    Модель для хранения правильных вариантов открытых вопросов
    """
    question = models.ForeignKey(
        EnhancedLMSQuestion,
        on_delete=models.CASCADE,
        related_name='open_answer_options',
        verbose_name=_('question')
    )
    text = models.TextField(_('correct answer text'))
    is_case_sensitive = models.BooleanField(
        _('is case sensitive'), default=False)
    match_exact = models.BooleanField(_('match exact'), default=False)

    class Meta:
        verbose_name = _('open answer option')
        verbose_name_plural = _('open answer options')

    def __str__(self):
        return f"{self.question.text[:30]} - {self.text[:30]}"


class EnhancedTestSettings(models.Model):
    """
    Настройки для расширенного тестирования
    """
    test = models.OneToOneField(
        LMSTest,
        on_delete=models.CASCADE,
        related_name='enhanced_settings',
        verbose_name=_('test')
    )
    time_limit_minutes = models.PositiveIntegerField(
        _('time limit in minutes'),
        default=0,
        help_text=_('0 означает отсутствие ограничения по времени')
    )
    passing_score_percent = models.PositiveIntegerField(
        _('passing score percent'),
        default=70,
        help_text=_('Процент правильных ответов для успешного прохождения')
    )
    show_correct_answers = models.BooleanField(
        _('show correct answers'),
        default=True
    )
    randomize_questions = models.BooleanField(
        _('randomize questions'),
        default=False
    )
    max_attempts = models.PositiveIntegerField(
        _('maximum attempts'),
        default=0,
        help_text=_('0 означает неограниченное количество попыток')
    )

    class Meta:
        verbose_name = _('enhanced test settings')
        verbose_name_plural = _('enhanced test settings')

    def __str__(self):
        return f"Settings for {self.test.title}"


class UserTestAttempt(models.Model):
    """
    Модель для отслеживания попыток прохождения теста
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='test_attempts',
        verbose_name=_('user')
    )
    test = models.ForeignKey(
        LMSTest,
        on_delete=models.CASCADE,
        related_name='user_attempts',
        verbose_name=_('test')
    )
    started_at = models.DateTimeField(_('started at'), default=timezone.now)
    completed_at = models.DateTimeField(
        _('completed at'), null=True, blank=True)
    score = models.PositiveIntegerField(_('score'), default=0)
    max_score = models.PositiveIntegerField(_('max score'), default=0)
    is_passed = models.BooleanField(_('is passed'), default=False)
    time_spent_seconds = models.PositiveIntegerField(
        _('time spent seconds'), default=0)

    class Meta:
        verbose_name = _('user test attempt')
        verbose_name_plural = _('user test attempts')
        ordering = ['-started_at']

    def __str__(self):
        completed_status = "completed" if self.completed_at else "in progress"
        return f"{self.user.email} - {self.test.title} - {completed_status}"


class UserOpenAnswer(models.Model):
    """
    Модель для хранения открытых ответов пользователя
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='open_answers',
        verbose_name=_('user')
    )
    question = models.ForeignKey(
        EnhancedLMSQuestion,
        on_delete=models.CASCADE,
        related_name='user_open_answers',
        verbose_name=_('question')
    )
    answer_text = models.TextField(_('answer text'))
    is_correct = models.BooleanField(_('is correct'), default=False)
    attempt = models.ForeignKey(
        UserTestAttempt,
        on_delete=models.CASCADE,
        related_name='open_answers',
        verbose_name=_('attempt')
    )
    answered_at = models.DateTimeField(_('answered at'), default=timezone.now)

    class Meta:
        verbose_name = _('user open answer')
        verbose_name_plural = _('user open answers')

    def __str__(self):
        return f"{self.user.email} - {self.question.text[:30]} - {self.answer_text[:30]}"


class LessonProgress(models.Model):
    """
    Модель для отслеживания прогресса по урокам
    """
    class ProgressStatus(models.TextChoices):
        NOT_STARTED = 'not_started', _('Not started')
        IN_PROGRESS = 'in_progress', _('In progress')
        COMPLETED = 'completed', _('Completed')

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='lesson_progress',
        verbose_name=_('user')
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='user_progress',
        verbose_name=_('lesson')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=ProgressStatus.choices,
        default=ProgressStatus.NOT_STARTED
    )
    progress_percent = models.PositiveIntegerField(
        _('progress percent'), default=0)
    last_accessed = models.DateTimeField(
        _('last accessed'), null=True, blank=True)
    completed_at = models.DateTimeField(
        _('completed at'), null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(
        _('time spent seconds'), default=0)

    class Meta:
        verbose_name = _('lesson progress')
        verbose_name_plural = _('lesson progress')
        unique_together = ['user', 'lesson']

    def __str__(self):
        return f"{self.user.email} - {self.lesson.title} - {self.get_status_display()}"
