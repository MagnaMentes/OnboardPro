from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from departments.models import Department


class UserRole(models.TextChoices):
    """Перечисление ролей пользователей системы"""
    ADMIN = 'admin', _('Administrator')
    HR = 'hr', _('HR Manager')
    MANAGER = 'manager', _('Department Manager')
    EMPLOYEE = 'employee', _('Employee')


class UserManager(BaseUserManager):
    """
    Кастомный менеджер для модели пользователя с email в качестве USERNAME_FIELD
    """

    def create_user(self, email, username, password=None, **extra_fields):
        """
        Создаёт и сохраняет обычного пользователя с указанными email и паролем
        """
        if not email:
            raise ValueError(_('The Email field must be set'))

        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        """
        Создаёт и сохраняет суперпользователя с указанными email и паролем
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', UserRole.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, username, password, **extra_fields)


class User(AbstractUser):
    """
    Кастомная модель пользователя, расширяющая стандартную модель Django
    Добавлены поля full_name, position, is_active, created_at, role
    USERNAME_FIELD = email для использования email вместо username
    """
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(_('full name'), max_length=255, blank=True)
    position = models.CharField(_('position'), max_length=100, blank=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees',
        verbose_name=_('department')
    )
    role = models.CharField(
        _('role'),
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
    )
    created_at = models.DateTimeField(_('created at'), default=timezone.now)
    notifications_enabled = models.BooleanField(
        _('notifications enabled'), default=True)
    notification_settings = models.JSONField(
        _('notification settings'), default=dict, blank=True, null=True)

    USERNAME_FIELD = 'email'
    # username всё еще требуется для совместимости с Django admin
    REQUIRED_FIELDS = ['username']

    objects = UserManager()

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """
        Возвращает full_name, если оно заполнено, иначе использует стандартный метод get_full_name
        """
        if self.full_name:
            return self.full_name
        return super().get_full_name()
