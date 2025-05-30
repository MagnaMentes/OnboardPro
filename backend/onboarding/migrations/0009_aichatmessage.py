# Generated by Django 5.2.1 on 2025-05-22 11:54

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('onboarding', '0008_aihint'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AIChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('human', 'Human'), ('assistant', 'Assistant')], default='human', max_length=20, verbose_name='role')),
                ('message', models.TextField(verbose_name='message')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, verbose_name='created at')),
                ('step_progress', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat_messages', to='onboarding.userstepprogress', verbose_name='step progress')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ai_chat_messages', to=settings.AUTH_USER_MODEL, verbose_name='user')),
            ],
            options={
                'verbose_name': 'AI chat message',
                'verbose_name_plural': 'AI chat messages',
                'ordering': ['created_at'],
                'indexes': [models.Index(fields=['user', 'step_progress'], name='onboarding__user_id_ef22c0_idx'), models.Index(fields=['created_at'], name='onboarding__created_277430_idx')],
            },
        ),
    ]
