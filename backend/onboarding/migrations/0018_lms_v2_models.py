from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        # Фактическая последняя миграция
        ('onboarding', '0015_alter_aichatmessage_step_progress'),
        # Фактическая последняя миграция
        ('users', '0004_add_department_field'),
    ]

    operations = [
        migrations.CreateModel(
            name='LearningModule',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='title')),
                ('description', models.TextField(
                    blank=True, verbose_name='description')),
                ('order', models.PositiveIntegerField(
                    default=0, verbose_name='order')),
                ('created_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='created at')),
                ('updated_at', models.DateTimeField(
                    auto_now=True, verbose_name='updated at')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL,
                 related_name='created_learning_modules', to='users.user', verbose_name='created by')),
                ('step', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='learning_modules', to='onboarding.onboardingstep', verbose_name='onboarding step')),
            ],
            options={
                'verbose_name': 'learning module',
                'verbose_name_plural': 'learning modules',
                'ordering': ['step', 'order'],
                'unique_together': {('step', 'order')},
            },
        ),
        migrations.CreateModel(
            name='Lesson',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='title')),
                ('description', models.TextField(
                    blank=True, verbose_name='description')),
                ('content', models.TextField(verbose_name='content')),
                ('content_type', models.CharField(choices=[('text', 'Text'), ('video', 'Video'), ('presentation', 'Presentation'), (
                    'mixed', 'Mixed content')], default='text', max_length=20, verbose_name='content type')),
                ('order', models.PositiveIntegerField(
                    default=0, verbose_name='order')),
                ('estimated_minutes', models.PositiveIntegerField(
                    default=15, verbose_name='estimated minutes')),
                ('created_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='created at')),
                ('updated_at', models.DateTimeField(
                    auto_now=True, verbose_name='updated at')),
                ('module', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='lessons', to='onboarding.learningmodule', verbose_name='learning module')),
            ],
            options={
                'verbose_name': 'lesson',
                'verbose_name_plural': 'lessons',
                'ordering': ['module', 'order'],
                'unique_together': {('module', 'order')},
            },
        ),
        migrations.CreateModel(
            name='EnhancedLMSQuestion',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(verbose_name='question text')),
                ('question_type', models.CharField(choices=[('single_choice', 'Single choice'), ('multiple_choice', 'Multiple choice'), (
                    'open_answer', 'Open answer')], default='single_choice', max_length=20, verbose_name='question type')),
                ('order', models.PositiveIntegerField(
                    default=0, verbose_name='order')),
                ('explanation', models.TextField(
                    blank=True, help_text='Пояснение, которое будет показано после ответа на вопрос', verbose_name='explanation')),
                ('test', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='enhanced_questions', to='onboarding.lmstest', verbose_name='test')),
            ],
            options={
                'verbose_name': 'enhanced LMS question',
                'verbose_name_plural': 'enhanced LMS questions',
                'ordering': ['test', 'order'],
            },
        ),
        migrations.CreateModel(
            name='Attachment',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='title')),
                ('description', models.TextField(
                    blank=True, verbose_name='description')),
                ('attachment_type', models.CharField(choices=[('file', 'File'), ('link', 'Link'), ('video', 'Video'), (
                    'image', 'Image'), ('other', 'Other')], max_length=20, verbose_name='attachment type')),
                ('file_path', models.FileField(blank=True, null=True,
                 upload_to='learning_attachments/', verbose_name='file path')),
                ('external_url', models.URLField(
                    blank=True, verbose_name='external URL')),
                ('order', models.PositiveIntegerField(
                    default=0, verbose_name='order')),
                ('created_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='created at')),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='attachments', to='onboarding.lesson', verbose_name='lesson')),
            ],
            options={
                'verbose_name': 'attachment',
                'verbose_name_plural': 'attachments',
                'ordering': ['lesson', 'order'],
            },
        ),
        migrations.CreateModel(
            name='EnhancedTestSettings',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('time_limit_minutes', models.PositiveIntegerField(
                    default=0, help_text='0 означает отсутствие ограничения по времени', verbose_name='time limit in minutes')),
                ('passing_score_percent', models.PositiveIntegerField(
                    default=70, help_text='Процент правильных ответов для успешного прохождения', verbose_name='passing score percent')),
                ('show_correct_answers', models.BooleanField(
                    default=True, verbose_name='show correct answers')),
                ('randomize_questions', models.BooleanField(
                    default=False, verbose_name='randomize questions')),
                ('max_attempts', models.PositiveIntegerField(
                    default=0, help_text='0 означает неограниченное количество попыток', verbose_name='maximum attempts')),
                ('test', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE,
                 related_name='enhanced_settings', to='onboarding.lmstest', verbose_name='test')),
            ],
            options={
                'verbose_name': 'enhanced test settings',
                'verbose_name_plural': 'enhanced test settings',
            },
        ),
        migrations.CreateModel(
            name='OpenAnswerOption',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(verbose_name='correct answer text')),
                ('is_case_sensitive', models.BooleanField(
                    default=False, verbose_name='is case sensitive')),
                ('match_exact', models.BooleanField(
                    default=False, verbose_name='match exact')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='open_answer_options', to='onboarding.enhancedlmsquestion', verbose_name='question')),
            ],
            options={
                'verbose_name': 'open answer option',
                'verbose_name_plural': 'open answer options',
            },
        ),
        migrations.CreateModel(
            name='UserTestAttempt',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('started_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='started at')),
                ('completed_at', models.DateTimeField(
                    blank=True, null=True, verbose_name='completed at')),
                ('score', models.PositiveIntegerField(
                    default=0, verbose_name='score')),
                ('max_score', models.PositiveIntegerField(
                    default=0, verbose_name='max score')),
                ('is_passed', models.BooleanField(
                    default=False, verbose_name='is passed')),
                ('time_spent_seconds', models.PositiveIntegerField(
                    default=0, verbose_name='time spent seconds')),
                ('test', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='user_attempts', to='onboarding.lmstest', verbose_name='test')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='test_attempts', to='users.user', verbose_name='user')),
            ],
            options={
                'verbose_name': 'user test attempt',
                'verbose_name_plural': 'user test attempts',
                'ordering': ['-started_at'],
            },
        ),
        migrations.CreateModel(
            name='UserOpenAnswer',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('answer_text', models.TextField(verbose_name='answer text')),
                ('is_correct', models.BooleanField(
                    default=False, verbose_name='is correct')),
                ('answered_at', models.DateTimeField(
                    default=django.utils.timezone.now, verbose_name='answered at')),
                ('attempt', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='open_answers', to='onboarding.usertestattempt', verbose_name='attempt')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='user_open_answers', to='onboarding.enhancedlmsquestion', verbose_name='question')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='open_answers', to='users.user', verbose_name='user')),
            ],
            options={
                'verbose_name': 'user open answer',
                'verbose_name_plural': 'user open answers',
            },
        ),
        migrations.CreateModel(
            name='LessonProgress',
            fields=[
                ('id', models.AutoField(auto_created=True,
                 primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('not_started', 'Not started'), ('in_progress', 'In progress'), (
                    'completed', 'Completed')], default='not_started', max_length=20, verbose_name='status')),
                ('progress_percent', models.PositiveIntegerField(
                    default=0, verbose_name='progress percent')),
                ('last_accessed', models.DateTimeField(
                    blank=True, null=True, verbose_name='last accessed')),
                ('completed_at', models.DateTimeField(
                    blank=True, null=True, verbose_name='completed at')),
                ('time_spent_seconds', models.PositiveIntegerField(
                    default=0, verbose_name='time spent seconds')),
                ('lesson', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='user_progress', to='onboarding.lesson', verbose_name='lesson')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                 related_name='lesson_progress', to='users.user', verbose_name='user')),
            ],
            options={
                'verbose_name': 'lesson progress',
                'verbose_name_plural': 'lesson progress',
                'unique_together': {('user', 'lesson')},
            },
        ),
    ]
