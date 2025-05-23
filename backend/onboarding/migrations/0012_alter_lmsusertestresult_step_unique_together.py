from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('onboarding', '0011_auto_populate_test_result_step'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lmsusertestresult',
            name='step',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='test_results',
                to='onboarding.onboardingstep',
                verbose_name='step'
            ),
        ),
        migrations.AlterUniqueTogether(
            name='lmsusertestresult',
            unique_together={('user', 'test', 'step')},
        ),
    ]
