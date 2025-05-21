from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import OnboardingProgram, OnboardingStep, UserOnboardingAssignment, UserStepProgress

User = get_user_model()


class OnboardingStepSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели шага онбординга
    """
    class Meta:
        model = OnboardingStep
        fields = [
            'id', 'name', 'description', 'step_type', 'order',
            'program', 'is_required', 'deadline_days'
        ]
        read_only_fields = ['order', 'program']


class OnboardingProgramSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели онбординг-программы
    """
    steps = OnboardingStepSerializer(many=True, read_only=True)
    author_email = serializers.EmailField(
        source='author.email', read_only=True)

    class Meta:
        model = OnboardingProgram
        fields = [
            'id', 'name', 'description', 'created_at',
            'author', 'author_email', 'steps'
        ]
        read_only_fields = ['created_at', 'author_email', 'author']


class UserOnboardingAssignmentSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели назначения онбординг-программы пользователю
    """
    program_name = serializers.CharField(source='program.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserOnboardingAssignment
        fields = [
            'id', 'user', 'user_email', 'program', 'program_name',
            'assigned_at', 'status'
        ]
        read_only_fields = ['assigned_at', 'user_email', 'program_name']


class UserStepProgressSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели прогресса пользователя по шагам
    """
    step_name = serializers.CharField(source='step.name', read_only=True)
    step_type = serializers.CharField(source='step.step_type', read_only=True)

    class Meta:
        model = UserStepProgress
        fields = [
            'id', 'user', 'step', 'step_name', 'step_type',
            'status', 'completed_at', 'planned_date_start',
            'planned_date_end', 'actual_completed_at'
        ]
        read_only_fields = [
            'completed_at', 'step_name', 'step_type', 'planned_date_start',
            'planned_date_end', 'actual_completed_at'
        ]


class AssignProgramSerializer(serializers.Serializer):
    """
    Сериализатор для назначения программы пользователю
    """
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Пользователь с указанным ID не найден")


class CompleteStepSerializer(serializers.Serializer):
    """
    Сериализатор для отметки шага как выполненного
    """
    user_id = serializers.IntegerField(required=False)

    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Пользователь с указанным ID не найден")


class ProgramProgressSerializer(serializers.ModelSerializer):
    """
    Сериализатор для отображения прогресса по программе
    """
    steps_progress = serializers.SerializerMethodField()
    program_name = serializers.CharField(source='program.name', read_only=True)
    total_steps = serializers.SerializerMethodField()
    completed_steps = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = UserOnboardingAssignment
        fields = [
            'id', 'program', 'program_name', 'assigned_at', 'status',
            'total_steps', 'completed_steps', 'progress_percentage',
            'steps_progress'
        ]

    def get_steps_progress(self, obj):
        # Получаем все шаги программы
        steps = obj.program.steps.all().order_by('order')
        result = []

        for step in steps:
            # Ищем прогресс пользователя по этому шагу
            progress, created = UserStepProgress.objects.get_or_create(
                user=obj.user,
                step=step,
                defaults={'status': UserStepProgress.ProgressStatus.NOT_STARTED}
            )

            result.append({
                'step_id': step.id,
                'name': step.name,
                'type': step.step_type,
                'order': step.order,
                'is_required': step.is_required,
                'status': progress.status,
                'completed_at': progress.completed_at
            })

        return result

    def get_total_steps(self, obj):
        return obj.program.steps.count()

    def get_completed_steps(self, obj):
        return UserStepProgress.objects.filter(
            user=obj.user,
            step__program=obj.program,
            status=UserStepProgress.ProgressStatus.DONE
        ).count()

    def get_progress_percentage(self, obj):
        total = self.get_total_steps(obj)
        if total == 0:
            return 100  # Если шагов нет, считаем программу выполненной

        completed = self.get_completed_steps(obj)
        return int((completed / total) * 100)
