from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


class HRMetricSnapshot(models.Model):
    """
    Модель для хранения снэпшотов метрик HR-дашборда
    """
    timestamp = models.DateTimeField(auto_now_add=True)
    metric_key = models.CharField(max_length=100)
    metric_value = models.FloatField()
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'HR Metric Snapshot'
        verbose_name_plural = 'HR Metric Snapshots'
        indexes = [
            models.Index(fields=['metric_key', '-timestamp']),
            models.Index(fields=['department', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.metric_key}: {self.metric_value} at {self.timestamp}"


class HRAlertRule(models.Model):
    """
    Модель для правил генерации HR-алертов
    """
    class Severity(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    name = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.MEDIUM
    )
    is_active = models.BooleanField(default=True)

    # Условия для срабатывания правила
    metric_key = models.CharField(max_length=100)
    threshold_value = models.FloatField()
    comparison = models.CharField(
        max_length=20,
        choices=[
            ('gt', 'Greater than'),
            ('lt', 'Less than'),
            ('eq', 'Equal to'),
        ]
    )

    # Настройки уведомлений
    notify_hr = models.BooleanField(default=True)
    notify_admin = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'HR Alert Rule'
        verbose_name_plural = 'HR Alert Rules'

    def __str__(self):
        return self.name


class HRAlert(models.Model):
    """
    Модель для HR-алертов
    """
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        DISMISSED = 'dismissed', 'Dismissed'

    title = models.CharField(max_length=200)
    message = models.TextField()
    rule = models.ForeignKey(
        HRAlertRule,
        on_delete=models.SET_NULL,
        null=True,
        related_name='alerts'
    )
    severity = models.CharField(
        max_length=20,
        choices=HRAlertRule.Severity.choices
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN
    )

    # Связь с объектом, вызвавшим алерт (StepFeedback, OnboardingAssignment и т.п.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    # Метаданные
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_alerts'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'HR Alert'
        verbose_name_plural = 'HR Alerts'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['severity', '-created_at']),
            models.Index(fields=['department', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_severity_display()})"

    def resolve(self, user, notes=''):
        """
        Отметить алерт как решенный
        """
        self.status = self.Status.RESOLVED
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.resolution_notes = notes
        self.save()
