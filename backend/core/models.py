from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    ROLE_CHOICES = (
        ('employee', 'Employee'),
        ('manager', 'Manager'),
        ('hr', 'HR'),
    )
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default='employee')
    department = models.CharField(max_length=100, blank=True)


class OnboardingPlan(models.Model):
    role = models.CharField(max_length=20, choices=settings.ROLE_CHOICES)
    title = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.role}"


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed')
    ]

    plan = models.ForeignKey(OnboardingPlan, on_delete=models.CASCADE, related_name='tasks')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"

    class Meta:
        ordering = ['deadline', '-priority']
