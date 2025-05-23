from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q
from .models import VirtualMeetingSlot, OnboardingStep, UserOnboardingAssignment


class VirtualMeetingSlotSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели виртуальных встреч
    """
    step_name = serializers.CharField(source='step.name', read_only=True)
    assigned_user_email = serializers.EmailField(
        source='assigned_user.email', read_only=True)
    step_type = serializers.CharField(source='step.step_type', read_only=True)

    class Meta:
        model = VirtualMeetingSlot
        fields = [
            'id', 'step', 'step_name', 'step_type',
            'assigned_user', 'assigned_user_email',
            'start_time', 'end_time', 'meeting_link'
        ]
        read_only_fields = ['step_name', 'assigned_user_email', 'step_type']

    def validate(self, data):
        """
        Проверка:
        1. Встреча должна быть назначена на шаг с is_virtual_meeting=True
        2. Время начала должно быть раньше времени окончания
        3. У пользователя не должно быть пересекающихся слотов
        4. Пользователь должен быть назначен на программу, содержащую шаг
        """
        step = data['step']
        assigned_user = data['assigned_user']
        start_time = data['start_time']
        end_time = data['end_time']

        # Проверка, что шаг поддерживает виртуальные встречи
        if not step.is_virtual_meeting:
            raise serializers.ValidationError(
                "Данный шаг не поддерживает виртуальные встречи."
            )

        # Проверка, что время начала раньше времени окончания
        if start_time >= end_time:
            raise serializers.ValidationError(
                "Время начала встречи должно быть раньше времени окончания."
            )

        # Проверка на пересечение с другими слотами пользователя
        # Исключаем текущий объект при обновлении
        overlapping_slots_query = Q(
            assigned_user=assigned_user,
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        instance = self.instance
        if instance:
            overlapping_slots_query &= ~Q(pk=instance.pk)

        overlapping_slots = VirtualMeetingSlot.objects.filter(
            overlapping_slots_query).exists()
        if overlapping_slots:
            raise serializers.ValidationError(
                "У пользователя уже есть пересекающиеся встречи в указанное время."
            )

        # Проверка, назначен ли пользователь на программу
        program = step.program
        is_assigned = UserOnboardingAssignment.objects.filter(
            user=assigned_user,
            program=program,
            status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
        ).exists()

        if not is_assigned:
            raise serializers.ValidationError(
                "Пользователь должен быть назначен на программу онбординга, содержащую данный шаг."
            )

        return data
