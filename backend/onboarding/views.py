from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction, models
from django.contrib.auth import get_user_model
from users.permissions import IsAdminOrHR
from users.models import UserRole
from .permissions import IsAssignedUserOrHRorAdmin
from .models import OnboardingProgram, OnboardingStep, UserOnboardingAssignment, UserStepProgress
from .serializers import (
    OnboardingProgramSerializer, OnboardingStepSerializer,
    UserOnboardingAssignmentSerializer, UserStepProgressSerializer,
    AssignProgramSerializer, CompleteStepSerializer, ProgramProgressSerializer
)
from .services import SmartSchedulerService

User = get_user_model()


class OnboardingProgramListView(generics.ListCreateAPIView):
    """
    Представление для получения списка и создания онбординг-программ
    """
    queryset = OnboardingProgram.objects.all()
    serializer_class = OnboardingProgramSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class OnboardingProgramDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Представление для получения, обновления и удаления онбординг-программы
    """
    queryset = OnboardingProgram.objects.all()
    serializer_class = OnboardingProgramSerializer
    permission_classes = [permissions.IsAuthenticated]


class AssignProgramView(generics.GenericAPIView):
    """
    Представление для назначения программы пользователю
    Доступно только для HR и Admin
    """
    serializer_class = AssignProgramSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrHR]

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        program = get_object_or_404(OnboardingProgram, pk=pk)
        user_id = serializer.validated_data['user_id']

        # Создаем назначение программы пользователю
        with transaction.atomic():
            assignment, created = UserOnboardingAssignment.objects.get_or_create(
                user_id=user_id,
                program=program,
                defaults={
                    'status': UserOnboardingAssignment.AssignmentStatus.ACTIVE}
            )

            # Если назначение уже существовало и было завершено, активируем его снова
            if not created and assignment.status == UserOnboardingAssignment.AssignmentStatus.COMPLETED:
                assignment.status = UserOnboardingAssignment.AssignmentStatus.ACTIVE
                assignment.save()

            # Создаем записи о прогрессе для каждого шага программы
            for step in program.steps.all():
                UserStepProgress.objects.get_or_create(
                    user_id=user_id,
                    step=step,
                    defaults={
                        'status': UserStepProgress.ProgressStatus.NOT_STARTED}
                )

            # Применяем умное планирование с использованием SmartSchedulerService
            SmartSchedulerService.schedule_steps(assignment)

        return Response(
            {'message': 'Программа успешно назначена пользователю и спланирована'},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class UserAssignmentsView(generics.ListAPIView):
    """
    Представление для получения списка назначений текущего пользователя
    """
    serializer_class = UserOnboardingAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserOnboardingAssignment.objects.filter(user=self.request.user)


class CompleteStepView(generics.GenericAPIView):
    """
    Представление для отметки шага как выполненного
    """
    serializer_class = CompleteStepSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        step = get_object_or_404(OnboardingStep, pk=pk)

        # Определяем пользователя для которого отмечаем шаг
        if 'user_id' in serializer.validated_data and (request.user.role in [UserRole.ADMIN, UserRole.HR]):
            # HR или Admin могут отмечать шаги за других пользователей
            user_id = serializer.validated_data['user_id']
            user = get_object_or_404(User, pk=user_id)
        else:
            # Обычный пользователь может отмечать только свои шаги
            user = request.user

        # Проверяем, что пользователь имеет назначение на программу, содержащую этот шаг
        assignment = get_object_or_404(
            UserOnboardingAssignment,
            user=user,
            program=step.program,
            status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
        )

        # Получаем или создаем запись о прогрессе
        progress, created = UserStepProgress.objects.get_or_create(
            user=user,
            step=step,
            defaults={'status': UserStepProgress.ProgressStatus.NOT_STARTED}
        )

        # Отмечаем шаг как выполненный
        progress.mark_as_done()

        # Проверяем, все ли обязательные шаги выполнены
        required_steps = step.program.steps.filter(is_required=True)
        completed_required_steps = UserStepProgress.objects.filter(
            user=user,
            step__in=required_steps,
            status=UserStepProgress.ProgressStatus.DONE
        ).count()

        # Если все обязательные шаги выполнены, отмечаем программу как завершенную
        if completed_required_steps == required_steps.count():
            assignment.status = UserOnboardingAssignment.AssignmentStatus.COMPLETED
            assignment.save()

        return Response({'message': 'Шаг успешно отмечен как выполненный'}, status=status.HTTP_200_OK)


class AssignmentProgressView(generics.RetrieveAPIView):
    """
    Доступно пользователю, которому назначена программа, или HR/Admin.
    """
    serializer_class = ProgramProgressSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def get_object(self):
        # Возвращаем все объекты UserOnboardingAssignment для фильтрации и проверки разрешений
        queryset = UserOnboardingAssignment.objects.all()
        obj = get_object_or_404(queryset, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)
        return obj


class OnboardingStepListCreateView(generics.ListCreateAPIView):
    """
    Представление для получения списка и создания шагов онбординга для программы
    """
    serializer_class = OnboardingStepSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        program_id = self.kwargs.get('program_id')
        return OnboardingStep.objects.filter(program_id=program_id).order_by('order')

    def perform_create(self, serializer):
        program_id = self.kwargs.get('program_id')
        program = get_object_or_404(OnboardingProgram, pk=program_id)
        # Получаем максимальный порядковый номер и добавляем 1
        max_order = OnboardingStep.objects.filter(program=program).aggregate(
            max_order=models.Max('order'))['max_order'] or 0
        serializer.save(program=program, order=max_order + 1)
