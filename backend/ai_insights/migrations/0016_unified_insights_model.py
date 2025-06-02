from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('departments', '0001_initial'),
        ('onboarding', '0018_lms_v2_models'),
        ('users', '0004_add_department_field'),
        ('ai_insights', '0015_training_insights_models'),
    ]

    operations = [
        migrations.CreateModel(
            name='InsightTag',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='name')),
                ('slug', models.SlugField(unique=True, verbose_name='slug')),
                ('description', models.TextField(
                    blank=True, verbose_name='description')),
                ('category', models.CharField(choices=[('general', 'General'), ('training', 'Training'), (
                    'performance', 'Performance'), ('risk', 'Risk')], default='general', max_length=20, verbose_name='category')),
                ('color', models.CharField(blank=True,
                 max_length=20, verbose_name='color')),
                ('created_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='created at')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='children', to='ai_insights.insighttag', verbose_name='parent tag')),
            ],
            options={
                'verbose_name': 'insight tag',
                'verbose_name_plural': 'insight tags',
                'ordering': ['category', 'name'],
            },
        ),
        migrations.CreateModel(
            name='AIInsightV2',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='title')),
                ('description', models.TextField(verbose_name='description')),
                ('insight_type', models.CharField(choices=[('general', 'General'), ('risk', 'Risk'), ('difficult_step', 'Difficult Step'), ('problematic_test', 'Problematic Test'), (
                    'struggling_user', 'Struggling User'), ('time_anomaly', 'Time Anomaly'), ('department_pattern', 'Department Pattern')], default='general', max_length=30, verbose_name='insight type')),
                ('risk_level', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), (
                    'critical', 'Critical')], default='medium', max_length=20, verbose_name='risk level')),
                ('status', models.CharField(choices=[('active', 'Active'), ('acknowledged', 'Acknowledged'), (
                    'resolved', 'Resolved'), ('dismissed', 'Dismissed')], default='active', max_length=20, verbose_name='status')),
                ('severity', models.FloatField(
                    default=0.0, help_text='Оценка серьезности проблемы от 0 до 1', verbose_name='severity')),
                ('metadata', models.JSONField(blank=True,
                 default=dict, verbose_name='metadata')),
                ('created_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='created at')),
                ('updated_at', models.DateTimeField(
                    auto_now=True, verbose_name='updated at')),
                ('resolved_at', models.DateTimeField(
                    blank=True, null=True, verbose_name='resolved at')),
                ('department', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='ai_insights', to='departments.department', verbose_name='department')),
                ('question', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='ai_insights', to='onboarding.lmsquestion', verbose_name='question')),
                ('step', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='ai_insights', to='onboarding.onboardingstep', verbose_name='step')),
                ('tags', models.ManyToManyField(blank=True, related_name='insights',
                 to='ai_insights.insighttag', verbose_name='tags')),
                ('test', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='ai_insights', to='onboarding.lmstest', verbose_name='test')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='ai_insights_v2', to='users.user', verbose_name='user')),
            ],
            options={
                'verbose_name': 'AI insight',
                'verbose_name_plural': 'AI insights',
                'ordering': ['-created_at', '-severity'],
            },
        ),
        migrations.AddIndex(
            model_name='AIInsightV2',
            index=models.Index(fields=['insight_type'],
                               name='ai_insights_insight__072c16_idx'),
        ),
        migrations.AddIndex(
            model_name='AIInsightV2',
            index=models.Index(fields=['risk_level'],
                               name='ai_insights_risk_le_b7d1a3_idx'),
        ),
        migrations.AddIndex(
            model_name='AIInsightV2',
            index=models.Index(fields=['status'],
                               name='ai_insights_status_1a9876_idx'),
        ),
        migrations.AddIndex(
            model_name='AIInsightV2',
            index=models.Index(fields=['created_at'],
                               name='ai_insights_created_234567_idx'),
        ),
    ]
