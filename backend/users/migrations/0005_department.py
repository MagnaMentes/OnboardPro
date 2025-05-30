# Generated by Django 5.2.1 on 2025-05-30 13:16

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_add_department_field'),
    ]

    operations = [
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='name')),
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, verbose_name='created at')),
                ('is_active', models.BooleanField(default=True, verbose_name='is active')),
                ('manager', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='user_managed_departments', to=settings.AUTH_USER_MODEL, verbose_name='manager')),
            ],
            options={
                'verbose_name': 'department',
                'verbose_name_plural': 'departments',
                'ordering': ['name'],
            },
        ),
    ]
