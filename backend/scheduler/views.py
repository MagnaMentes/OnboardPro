from rest_framework import viewsets, status, views, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
import logging
from .models import (
    ScheduledOnboardingStep, ScheduleConstraint, UserAvailability,
    MentorLoad, CalendarEvent
)
from .serializers import (
    ScheduledOnboardingStepSerializer, ScheduleConstraintSerializer,
    UserAvailabilitySerializer, MentorLoadSerializer,
    CalendarEventSerializer, SchedulePlanningSerializer,
    ScheduleOverrideSerializer, ConflictsSerializer,
    UserScheduleSerializer
)
from .services import SmartSchedulerEngine
from .ai_services import SmartPrioritizationEngine
from onboarding.models import UserOnboardingAssignment, UserStepProgress
from users.models import User

logger = logging.getLogger(__name__)


class ScheduledStepViewSet(viewsets.ModelViewSet):
    """ViewSet для запланированных шагов онбординга"""
    queryset = ScheduledOnboardingStep.objects.all()
    serializer_class = ScheduledOnboardingStepSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Фильтрация по пользователю
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(step_progress__user_id=user_id)

        # Фильтрация по временному диапазону
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            start_date = datetime.fromisoformat(start_date)
            queryset = queryset.filter(scheduled_end_time__gte=start_date)

        if end_date:
            end_date = datetime.fromisoformat(end_date)
            queryset = queryset.filter(scheduled_start_time__lte=end_date)

        # Фильтрация по программе
        program_id = self.request.query_params.get('program_id')
        if program_id:
            queryset = queryset.filter(
                step_progress__step__program_id=program_id)

        return queryset.select_related('step_progress', 'step_progress__step', 'step_progress__user')


class ScheduleConstraintViewSet(viewsets.ModelViewSet):
    """ViewSet для ограничений расписания"""
    queryset = ScheduleConstraint.objects.all()
    serializer_class = ScheduleConstraintSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class UserAvailabilityViewSet(viewsets.ModelViewSet):
    """ViewSet для доступности пользователей"""
    queryset = UserAvailability.objects.all()
    serializer_class = UserAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Обычные пользователи видят только свои записи
        if not self.request.user.is_staff and not self.request.user.role in ['admin', 'hr']:
            queryset = queryset.filter(user=self.request.user)

        # Фильтрация по пользователю (для админов и HR)
        user_id = self.request.query_params.get('user_id')
        if user_id and (self.request.user.is_staff or self.request.user.role in ['admin', 'hr']):
            queryset = queryset.filter(user_id=user_id)

        return queryset


class MentorLoadViewSet(viewsets.ModelViewSet):
    """ViewSet для нагрузки на менторов"""
    queryset = MentorLoad.objects.all()
    serializer_class = MentorLoadSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class CalendarEventViewSet(viewsets.ModelViewSet):
    """ViewSet для событий календаря"""
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Обычные пользователи видят только свои события
        if not self.request.user.is_staff and not self.request.user.role in ['admin', 'hr']:
            queryset = queryset.filter(participants=self.request.user)

        # Фильтрация по пользователю (для админов и HR)
        user_id = self.request.query_params.get('user_id')
        if user_id and (self.request.user.is_staff or self.request.user.role in ['admin', 'hr']):
            queryset = queryset.filter(participants__id=user_id)

        # Фильтрация по типу события
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        # Фильтрация по временному диапазону
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            start_date = datetime.fromisoformat(start_date)
            queryset = queryset.filter(end_time__gte=start_date)

        if end_date:
            end_date = datetime.fromisoformat(end_date)
            queryset = queryset.filter(start_time__lte=end_date)

        return queryset.prefetch_related('participants')


class SchedulerPlanAPIView(views.APIView):
    """API для запуска планирования"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, *args, **kwargs):
        serializer = SchedulePlanningSerializer(data=request.data)

        if serializer.is_valid():
            assignment_id = serializer.validated_data['assignment_id']

            # Запускаем планирование
            result = SmartSchedulerEngine.plan_assignment(assignment_id)

            if result:
                return Response({
                    'status': 'success',
                    'message': 'Planning completed successfully',
                    'assignment_id': assignment_id
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'status': 'error',
                    'message': 'Failed to plan assignment',
                    'assignment_id': assignment_id
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SchedulerUserAPIView(views.APIView):
    """API для получения расписания пользователя"""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, *args, **kwargs):
        # Проверка прав доступа
        if str(request.user.id) != user_id and not request.user.is_staff and request.user.role not in ['admin', 'hr', 'manager']:
            return Response({
                'status': 'error',
                'message': 'You do not have permission to view this schedule'
            }, status=status.HTTP_403_FORBIDDEN)

        # Получаем параметры запроса
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date:
            start_date = datetime.fromisoformat(start_date)

        if end_date:
            end_date = datetime.fromisoformat(end_date)

        # Получаем расписание
        schedule = SmartSchedulerEngine.get_user_schedule(
            user_id, start_date, end_date)

        if schedule:
            return Response(schedule, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': 'Failed to retrieve user schedule'
            }, status=status.HTTP_400_BAD_REQUEST)


class SchedulerOverrideAPIView(views.APIView):
    """API для ручной корректировки расписания"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, *args, **kwargs):
        serializer = ScheduleOverrideSerializer(data=request.data)

        if serializer.is_valid():
            scheduled_step_id = serializer.validated_data['scheduled_step_id']
            new_start_time = serializer.validated_data['new_start_time']
            new_end_time = serializer.validated_data['new_end_time']

            # Корректируем расписание
            updated_step = SmartSchedulerEngine.override_scheduled_step(
                scheduled_step_id, new_start_time, new_end_time)

            if updated_step:
                # Сериализуем обновленный шаг для ответа
                step_serializer = ScheduledOnboardingStepSerializer(
                    updated_step)

                return Response({
                    'status': 'success',
                    'message': 'Schedule updated successfully',
                    'scheduled_step': step_serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'status': 'error',
                    'message': 'Failed to update schedule'
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SchedulerConflictsAPIView(views.APIView):
    """API для обнаружения конфликтов"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, *args, **kwargs):
        serializer = ConflictsSerializer(data=request.query_params)

        if serializer.is_valid():
            user_id = serializer.validated_data.get('user_id')
            start_date = serializer.validated_data.get('start_date')
            end_date = serializer.validated_data.get('end_date')

            # Обнаруживаем конфликты
            conflicts = SmartSchedulerEngine.detect_conflicts(
                user_id, start_date, end_date)

            return Response({
                'status': 'success',
                'conflicts': conflicts
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SmartPrioritizationAPIView(views.APIView):
    """API для интеллектуальной приоритизации задач"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, *args, **kwargs):
        # Получаем критические шаги
        program_id = request.query_params.get('program_id')
        critical_steps = SmartPrioritizationEngine.identify_critical_steps(
            program_id=program_id if program_id else None
        )

        # Получаем оптимизацию нагрузки
        user_ids = request.query_params.getlist('user_id')
        if not user_ids:
            user_ids = None

        workload_distribution = SmartPrioritizationEngine.optimize_workload_distribution(
            user_ids=user_ids
        )

        return Response({
            'status': 'success',
            'critical_steps': critical_steps,
            'workload_distribution': workload_distribution
        }, status=status.HTTP_200_OK)


class PredictDelaysAPIView(views.APIView):
    """API для прогнозирования задержек в выполнении шагов онбординга"""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, assignment_id=None):
        # Прогнозируем риски задержек
        delay_risks = SmartPrioritizationEngine.predict_delay_risks(
            assignment_id)

        return Response({
            'status': 'success',
            'assignment_id': assignment_id,
            'delay_risks': delay_risks
        }, status=status.HTTP_200_OK)
