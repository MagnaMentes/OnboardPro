"""
Миграция для добавления полей Smart Scheduler
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('onboarding', '0006_stepfeedback_auto_tag_stepfeedback_sentiment_score'),
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
