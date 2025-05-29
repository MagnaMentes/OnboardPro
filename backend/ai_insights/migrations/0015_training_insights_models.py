from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        # Предполагаемая последняя миграция для departments
        ('departments', '0001_initial'),
        ('onboarding', '0018_lms_v2_models'),
        # Фактическая последняя миграция для users
        ('users', '0004_add_department_field'),
        # Фактическая последняя миграция для ai_insights
        ('ai_insights', '0003_airecommendation'),
    ]

    operations = [
        migrations.CreateModel(
            name='TrainingInsight',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='title')),
                ('description', models.TextField(verbose_name='description')),
                ('insight_type', models.CharField(choices=[('difficult_step', 'Difficult Step'), ('problematic_test', 'Problematic Test'), ('struggling_user', 'Struggling User'), (
                    'time_anomaly', 'Time Anomaly'), ('department_pattern', 'Department Pattern')], max_length=30, verbose_name='insight type')),
                ('severity', models.FloatField(
                    default=0.0, help_text='Оценка серьезности проблемы от 0 до 1', verbose_name='severity')),
                ('created_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='created at')),
                ('is_dismissed', models.BooleanField(
                    default=False, verbose_name='is dismissed')),
                ('department', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='training_insights', to='departments.department', verbose_name='department')),
                ('question', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='training_insights', to='onboarding.lmsquestion', verbose_name='question')),
                ('step', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='training_insights', to='onboarding.onboardingstep', verbose_name='step')),
                ('test', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='training_insights', to='onboarding.lmstest', verbose_name='test')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='training_insights', to='users.user', verbose_name='user')),
            ],
            options={
                'verbose_name': 'training insight',
                'verbose_name_plural': 'training insights',
                'ordering': ['-created_at', '-severity'],
            },
        ),
        migrations.CreateModel(
            name='UserLearningMetric',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('avg_time_per_test', models.PositiveIntegerField(
                    default=0, verbose_name='average time per test in seconds')),
                ('avg_attempts_per_test', models.FloatField(
                    default=0.0, verbose_name='average attempts per test')),
                ('correct_answer_rate', models.FloatField(
                    default=0.0, help_text='Процент правильных ответов на вопросы тестов', verbose_name='correct answer rate')),
                ('test_completion_rate', models.FloatField(
                    default=0.0, help_text='Процент завершенных тестов от общего количества', verbose_name='test completion rate')),
                ('learning_speed_index', models.FloatField(
                    default=0.0, help_text='Индекс скорости обучения относительно других пользователей', verbose_name='learning speed index')),
                ('calculated_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='calculated at')),
                ('assignment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='learning_metrics', to='onboarding.useronboardingassignment', verbose_name='assignment')),
                ('step', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE,
                 related_name='learning_metrics', to='onboarding.onboardingstep', verbose_name='step')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='learning_metrics', to='users.user', verbose_name='user')),
            ],
            options={
                'verbose_name': 'user learning metric',
                'verbose_name_plural': 'user learning metrics',
                'ordering': ['-calculated_at'],
                'unique_together': {('user', 'assignment', 'step')},
            },
        ),
        migrations.CreateModel(
            name='QuestionDifficultyMetric',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('attempts_count', models.PositiveIntegerField(
                    default=0, verbose_name='attempts count')),
                ('success_rate', models.FloatField(
                    default=0.0, help_text='Процент правильных ответов на вопрос', verbose_name='success rate')),
                ('avg_time_seconds', models.PositiveIntegerField(
                    default=0, help_text='Среднее время, затрачиваемое на ответ на вопрос', verbose_name='average time in seconds')),
                ('difficulty_score', models.FloatField(
                    default=0.0, help_text='Расчетный показатель сложности вопроса от 0 до 1', verbose_name='difficulty score')),
                ('calculated_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='calculated at')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='difficulty_metrics', to='onboarding.lmsquestion', verbose_name='question')),
                ('test', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='question_difficulty_metrics', to='onboarding.lmstest', verbose_name='test')),
            ],
            options={
                'verbose_name': 'question difficulty metric',
                'verbose_name_plural': 'question difficulty metrics',
                'ordering': ['-difficulty_score'],
                'unique_together': {('question', 'calculated_at')},
            },
        ),
        migrations.CreateModel(
            name='DepartmentLearningMetric',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('user_count', models.PositiveIntegerField(
                    default=0, verbose_name='user count')),
                ('avg_test_completion_rate', models.FloatField(
                    default=0.0, verbose_name='average test completion rate')),
                ('avg_correct_answer_rate', models.FloatField(
                    default=0.0, verbose_name='average correct answer rate')),
                ('problematic_step_failure_rate', models.FloatField(
                    default=0.0, verbose_name='problematic step failure rate')),
                ('calculated_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='calculated at')),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='learning_metrics', to='departments.department', verbose_name='department')),
                ('most_problematic_step', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='problematic_for_departments', to='onboarding.onboardingstep', verbose_name='most problematic step')),
            ],
            options={
                'verbose_name': 'department learning metric',
                'verbose_name_plural': 'department learning metrics',
                'ordering': ['-calculated_at'],
            },
        ),
    ]
