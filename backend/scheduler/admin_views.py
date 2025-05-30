from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.shortcuts import get_object_or_404
from django.utils import timezone
from users.models import User
from .services import SmartSchedulerEngine
from .ai_services import SmartPrioritizationEngine


class AdminStaffRequiredMixin(UserPassesTestMixin):
    """Миксин для проверки, является ли пользователь админом или сотрудником с полным доступом"""

    def test_func(self):
        return self.request.user.is_staff or self.request.user.role in ['admin', 'hr']


class SchedulerUserAdminView(LoginRequiredMixin, AdminStaffRequiredMixin, TemplateView):
    """
    Административная панель для управления расписанием конкретного пользователя
    """
    template_name = 'scheduler/admin/user_schedule.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user_id = kwargs.get('user_id')
        user = get_object_or_404(User, id=user_id)

        # Получаем расписание пользователя на ближайшие 30 дней
        start_date = timezone.now()
        end_date = start_date + timezone.timedelta(days=30)
        schedule = SmartSchedulerEngine.get_user_schedule(
            user_id, start_date, end_date)

        # Прогнозируем риски задержек для активных назначений этого пользователя
        from onboarding.models import UserOnboardingAssignment
        assignments = UserOnboardingAssignment.objects.filter(
            user=user,
            status=UserOnboardingAssignment.AssignmentStatus.ACTIVE
        ).values_list('id', flat=True)

        delay_risks = []
        for assignment_id in assignments:
            risks = SmartPrioritizationEngine.predict_delay_risks(
                assignment_id)
            delay_risks.extend(risks)

        context.update({
            'user': user,
            'schedule': schedule,
            'delay_risks': delay_risks
        })

        return context


class SchedulerConflictsAdminView(LoginRequiredMixin, AdminStaffRequiredMixin, TemplateView):
    """
    Административная панель для обнаружения и разрешения конфликтов в расписании
    """
    template_name = 'scheduler/admin/conflicts.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Получаем конфликты за ближайшие 30 дней
        start_date = timezone.now()
        end_date = start_date + timezone.timedelta(days=30)

        conflicts = SmartSchedulerEngine.detect_conflicts(
            user_id=self.request.GET.get('user_id'),
            start_date=start_date,
            end_date=end_date
        )

        context['conflicts'] = conflicts
        return context


class SchedulerSummaryAdminView(LoginRequiredMixin, AdminStaffRequiredMixin, TemplateView):
    """
    Административная панель с аналитической сводкой по расписанию
    """
    template_name = 'scheduler/admin/summary.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Получаем критически важные шаги
        critical_steps = SmartPrioritizationEngine.identify_critical_steps()

        # Получаем оптимизацию нагрузки
        workload_distribution = SmartPrioritizationEngine.optimize_workload_distribution()

        context.update({
            'critical_steps': critical_steps,
            'workload_distribution': workload_distribution
        })

        return context
