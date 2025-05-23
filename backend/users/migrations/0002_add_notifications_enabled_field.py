from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='notifications_enabled',
            field=models.BooleanField(
                default=True, verbose_name='notifications enabled'),
        ),
    ]
