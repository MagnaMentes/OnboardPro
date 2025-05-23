from django.db import migrations


def populate_test_result_step(apps, schema_editor):
    LMSUserTestResult = apps.get_model('onboarding', 'LMSUserTestResult')
    db_alias = schema_editor.connection.alias

    # Для каждого результата теста
    for result in LMSUserTestResult.objects.using(db_alias).all():
        # Получаем шаг из связанного теста
        if result.test and result.test.step:
            result.step = result.test.step
            result.save()


def reverse_populate_test_result_step(apps, schema_editor):
    # Обратная операция не требуется, так как это не потеря данных
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('onboarding', '0010_lmsusertestresult_step'),
    ]

    operations = [
        migrations.RunPython(
            populate_test_result_step,
            reverse_populate_test_result_step
        ),
    ]
