# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        # Assuming there's an initial migration for departments
        ('departments', '0001_initial'),
        ('users', '0003_user_notification_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='department',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='employees',
                to='departments.department',
                verbose_name='department'
            ),
        ),
    ]
