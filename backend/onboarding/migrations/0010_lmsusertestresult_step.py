# Generated by Django 5.2.1 on 2025-05-22 15:09

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('onboarding', '0009_aichatmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='lmsusertestresult',
            name='step',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='test_results', to='onboarding.onboardingstep', verbose_name='step'),
        ),
    ]
