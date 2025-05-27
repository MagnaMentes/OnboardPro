import csv
import tempfile
from django.http import HttpResponse, FileResponse
from django.template.loader import render_to_string
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from weasyprint import HTML, CSS
from io import BytesIO, StringIO

from .models import UserOnboardingAssignment, OnboardingProgram, UserStepProgress
from .serializers import UserOnboardingAssignmentSerializer
from users.models import UserRole


class IsAdminOrHR(IsAuthenticated):
    """
    Разрешение для доступа только HR и Admin пользователям
    """

    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        return is_authenticated and request.user.role in [UserRole.ADMIN, UserRole.HR]


class ReportAssignmentPDFView(APIView):
    """
    Представление для генерации отчета о назначенных программах в формате PDF
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request, *args, **kwargs):
        # Получаем все назначения с информацией о пользователе и программе
        assignments = UserOnboardingAssignment.objects.select_related(
            'user', 'program'
        ).order_by('program__name')

        # Группировка назначений по программам для отчета
        programs_data = {}
        for assignment in assignments:
            if assignment.program.id not in programs_data:
                programs_data[assignment.program.id] = {
                    'program': assignment.program,
                    'assignments': []
                }

            # Получаем прогресс (% выполнения)
            total_steps = assignment.program.onboardingstep_set.count()
            completed_steps = UserStepProgress.objects.filter(
                user=assignment.user,
                step__program=assignment.program,
                status='done'
            ).count()

            progress_percentage = 0
            if total_steps > 0:
                progress_percentage = int(
                    (completed_steps / total_steps) * 100)

            # Добавляем данные о назначении
            programs_data[assignment.program.id]['assignments'].append({
                'user': assignment.user,
                'assigned_at': assignment.assigned_at,
                'status': assignment.status,
                'progress_percentage': progress_percentage,
                'completed_at': assignment.completed_at
            })

        # Генерация HTML для PDF
        html_string = render_to_string('onboarding/reports/assignments_pdf.html', {
            'programs_data': programs_data.values(),
            'title': 'Отчет по назначенным программам онбординга',
        })

        # Генерация PDF
        pdf_file = BytesIO()
        HTML(string=html_string).write_pdf(pdf_file)
        pdf_file.seek(0)

        # Возвращаем PDF-файл
        response = FileResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="onboarding_assignments_report.pdf"'
        return response


class ReportAssignmentCSVView(APIView):
    """
    Представление для генерации отчета о назначенных программах в формате CSV
    """
    permission_classes = [IsAdminOrHR]

    def get(self, request, *args, **kwargs):
        # Получаем все назначения с информацией о пользователе и программе
        assignments = UserOnboardingAssignment.objects.select_related(
            'user', 'program'
        ).order_by('program__name')

        # Создаем файл CSV в памяти
        csv_file = StringIO()
        writer = csv.writer(csv_file)

        # Добавляем заголовки
        headers = [
            'Программа', 'ФИО', 'Должность', 'Статус', 'Прогресс (%)',
            'Дата начала', 'Дата завершения'
        ]
        writer.writerow(headers)

        # Добавляем данные
        for assignment in assignments:
            # Получаем прогресс (% выполнения)
            total_steps = assignment.program.onboardingstep_set.count()
            completed_steps = UserStepProgress.objects.filter(
                user=assignment.user,
                step__program=assignment.program,
                status='done'
            ).count()

            progress_percentage = 0
            if total_steps > 0:
                progress_percentage = int(
                    (completed_steps / total_steps) * 100)

            # Форматируем даты
            assigned_at = assignment.assigned_at.strftime(
                '%d.%m.%Y') if assignment.assigned_at else ''
            completed_at = assignment.completed_at.strftime(
                '%d.%m.%Y') if assignment.completed_at else ''

            # Добавляем строку с данными
            writer.writerow([
                assignment.program.name,
                assignment.user.full_name,
                assignment.user.position,
                assignment.get_status_display() if hasattr(
                    assignment, 'get_status_display') else assignment.status,
                f"{progress_percentage}%",
                assigned_at,
                completed_at
            ])

        # Возвращаем CSV-файл
        csv_file.seek(0)
        response = HttpResponse(csv_file, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="onboarding_assignments_report.csv"'
        return response
