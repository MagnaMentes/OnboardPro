# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('departments', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='department',
            name='manager',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='managed_departments',
                to=settings.AUTH_USER_MODEL,
                verbose_name='manager'
            ),
        ),
    ]
