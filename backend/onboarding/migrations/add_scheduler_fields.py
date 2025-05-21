#!/usr/bin/env python
"""
Скрипт для создания миграции с новыми полями для Smart Scheduler
"""

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        # Предполагается, что последняя миграция - 0001_initial
        ('onboarding', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userstepprogress',
            name='planned_date_start',
            field=models.DateTimeField(
                blank=True, null=True, verbose_name='planned start date'),
        ),
        migrations.AddField(
            model_name='userstepprogress',
            name='planned_date_end',
            field=models.DateTimeField(
                blank=True, null=True, verbose_name='planned end date'),
        ),
        migrations.AddField(
            model_name='userstepprogress',
            name='actual_completed_at',
            field=models.DateTimeField(
                blank=True, null=True, verbose_name='actual completion date'),
        ),
    ]
