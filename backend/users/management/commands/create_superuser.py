from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import IntegrityError
import os

User = get_user_model()


class Command(BaseCommand):
    """
    Создает суперпользователя, если он не существует
    """
    help = 'Создание суперпользователя с фиксированными параметрами'

    def handle(self, *args, **options):
        username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@onboardpro.com')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'admin123')

        try:
            superuser = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
            self.stdout.write(self.style.SUCCESS(
                f'Суперпользователь {superuser.username} успешно создан'))
        except IntegrityError:
            self.stdout.write(self.style.WARNING(
                'Суперпользователь с таким email уже существует'))
            # Обновим пароль, если пользователь существует
            try:
                superuser = User.objects.get(email='admin@onboardpro.com')
                superuser.set_password('admin123')
                superuser.is_superuser = True
                superuser.is_staff = True
                superuser.save()
                self.stdout.write(self.style.SUCCESS(
                    f'Пароль для пользователя {superuser.username} обновлен'))
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(
                    'Пользователь с email admin@onboardpro.com не найден'))
