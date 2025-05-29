from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from departments.models import Department
from onboarding.models import OnboardingStep, UserOnboardingAssignment
from onboarding.lms_models import LMSTest, LMSQuestion, LMSUserTestResult

User = settings.AUTH_USER_MODEL


class TrainingInsight(models.Model):
    """
    Модель для хранения AI-инсайтов по обучению
    """
    class InsightType(models.TextChoices):
        DIFFICULT_STEP = 'difficult_step', _('Difficult Step')
        PROBLEMATIC_TEST = 'problematic_test', _('Problematic Test')
        STRUGGLING_USER = 'struggling_user', _('Struggling User')
        TIME_ANOMALY = 'time_anomaly', _('Time Anomaly')
        DEPARTMENT_PATTERN = 'department_pattern', _('Department Pattern')

    title = models.CharField(_('title'), max_length=255)
    description = models.TextField(_('description'))
    insight_type = models.CharField(
        _('insight type'),
        max_length=30,
        choices=InsightType.choices
    )
    severity = models.FloatField(
        _('severity'),
        default=0.0,
        help_text=_('Оценка серьезности проблемы от 0 до 1')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='training_insights',
        verbose_name=_('user'),
        null=True,
        blank=True
    )
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.SET_NULL,
        related_name='training_insights',
        verbose_name=_('step'),
        null=True,
        blank=True
    )
    test = models.ForeignKey(
        LMSTest,
        on_delete=models.SET_NULL,
        related_name='training_insights',
        verbose_name=_('test'),
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        related_name='training_insights',
        verbose_name=_('department'),
        null=True,
        blank=True
    )
    question = models.ForeignKey(
        LMSQuestion,
        on_delete=models.SET_NULL,
        related_name='training_insights',
        verbose_name=_('question'),
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    is_dismissed = models.BooleanField(_('is dismissed'), default=False)

    class Meta:
        verbose_name = _('training insight')
        verbose_name_plural = _('training insights')
        ordering = ['-created_at', '-severity']

    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"


class UserLearningMetric(models.Model):
    """
    Модель для хранения метрик обучения пользователя
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='learning_metrics',
        verbose_name=_('user')
    )
    assignment = models.ForeignKey(
        UserOnboardingAssignment,
        on_delete=models.CASCADE,
        related_name='learning_metrics',
        verbose_name=_('assignment')
    )
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='learning_metrics',
        verbose_name=_('step'),
        null=True
    )
    avg_time_per_test = models.PositiveIntegerField(
        _('average time per test in seconds'),
        default=0
    )
    avg_attempts_per_test = models.FloatField(
        _('average attempts per test'),
        default=0.0
    )
    correct_answer_rate = models.FloatField(
        _('correct answer rate'),
        default=0.0,
        help_text=_('Процент правильных ответов на вопросы тестов')
    )
    test_completion_rate = models.FloatField(
        _('test completion rate'),
        default=0.0,
        help_text=_('Процент завершенных тестов от общего количества')
    )
    learning_speed_index = models.FloatField(
        _('learning speed index'),
        default=0.0,
        help_text=_(
            'Индекс скорости обучения относительно других пользователей')
    )
    calculated_at = models.DateTimeField(
        _('calculated at'), default=timezone.now)

    class Meta:
        verbose_name = _('user learning metric')
        verbose_name_plural = _('user learning metrics')
        ordering = ['-calculated_at']
        unique_together = ['user', 'assignment', 'step']

    def __str__(self):
        step_name = self.step.name if self.step else 'Overall'
        return f"{self.user.email} - {step_name} - {self.calculated_at.strftime('%Y-%m-%d')}"


class DepartmentLearningMetric(models.Model):
    """
    Модель для хранения агрегированных метрик обучения по департаментам
    """
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='learning_metrics',
        verbose_name=_('department')
    )
    user_count = models.PositiveIntegerField(_('user count'), default=0)
    avg_test_completion_rate = models.FloatField(
        _('average test completion rate'),
        default=0.0
    )
    avg_correct_answer_rate = models.FloatField(
        _('average correct answer rate'),
        default=0.0
    )
    most_problematic_step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.SET_NULL,
        related_name='problematic_for_departments',
        verbose_name=_('most problematic step'),
        null=True,
        blank=True
    )
    problematic_step_failure_rate = models.FloatField(
        _('problematic step failure rate'),
        default=0.0
    )
    calculated_at = models.DateTimeField(
        _('calculated at'), default=timezone.now)

    class Meta:
        verbose_name = _('department learning metric')
        verbose_name_plural = _('department learning metrics')
        ordering = ['-calculated_at']

    def __str__(self):
        return f"{self.department.name} - {self.calculated_at.strftime('%Y-%m-%d')}"


class QuestionDifficultyMetric(models.Model):
    """
    Модель для хранения метрик сложности вопросов
    """
    question = models.ForeignKey(
        LMSQuestion,
        on_delete=models.CASCADE,
        related_name='difficulty_metrics',
        verbose_name=_('question')
    )
    test = models.ForeignKey(
        LMSTest,
        on_delete=models.CASCADE,
        related_name='question_difficulty_metrics',
        verbose_name=_('test')
    )
    attempts_count = models.PositiveIntegerField(
        _('attempts count'), default=0)
    success_rate = models.FloatField(
        _('success rate'),
        default=0.0,
        help_text=_('Процент правильных ответов на вопрос')
    )
    avg_time_seconds = models.PositiveIntegerField(
        _('average time in seconds'),
        default=0,
        help_text=_('Среднее время, затрачиваемое на ответ на вопрос')
    )
    difficulty_score = models.FloatField(
        _('difficulty score'),
        default=0.0,
        help_text=_('Расчетный показатель сложности вопроса от 0 до 1')
    )
    calculated_at = models.DateTimeField(
        _('calculated at'), default=timezone.now)

    class Meta:
        verbose_name = _('question difficulty metric')
        verbose_name_plural = _('question difficulty metrics')
        ordering = ['-difficulty_score']
        unique_together = ['question', 'calculated_at']

    def __str__(self):
        return f"{self.question.text[:50]} - Difficulty: {self.difficulty_score:.2f}"
