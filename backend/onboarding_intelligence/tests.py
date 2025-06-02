import json
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import (
    OnboardingProgressSnapshot,
    OnboardingRiskPrediction,
    OnboardingAnomaly,
    OnboardingDepartmentSummary
)
from departments.models import Department
from onboarding.models import OnboardingAssignment, OnboardingProgram
from users.models import CustomUser

User = get_user_model()


class IntelligenceAPITestCase(TestCase):
    """Тесты для API Intelligence Dashboard."""

    def setUp(self):
        """Настройка начальных данных для тестов."""
        # Создаем администратора
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpassword123',
            first_name='Admin',
            last_name='User'
        )

        # Создаем обычного пользователя
        self.regular_user = User.objects.create_user(
            email='user@example.com',
            password='userpassword123',
            first_name='Regular',
            last_name='User'
        )

        # Создаем отдел
        self.department = Department.objects.create(
            name='Test Department',
            description='A test department'
        )

        # Создаем программу онбординга
        self.program = OnboardingProgram.objects.create(
            name='Test Program',
            description='A test onboarding program',
            duration_days=30
        )

        # Создаем назначение онбординга
        self.assignment = OnboardingAssignment.objects.create(
            user=self.regular_user,
            program=self.program,
            department=self.department
        )

        # Создаем снимок прогресса онбординга
        self.progress_snapshot = OnboardingProgressSnapshot.objects.create(
            user=self.regular_user,
            assignment=self.assignment,
            department=self.department,
            completion_percentage=75,
            steps_total=20,
            steps_completed=15,
            steps_in_progress=3,
            steps_not_started=2,
            steps_overdue=0,
            avg_step_completion_time='02:30:00'
        )

        # Создаем прогноз риска
        self.risk_prediction = OnboardingRiskPrediction.objects.create(
            user=self.regular_user,
            assignment=self.assignment,
            department=self.department,
            risk_type='completion',
            severity='medium',
            probability=0.65,
            factors=json.dumps(
                {'late_assignments': 0.7, 'low_engagement': 0.5}),
            estimated_impact='Задержка завершения онбординга на 5-7 дней',
            recommendation='Запланировать встречу с руководителем для обсуждения прогресса'
        )

        # Создаем запись аномалии
        self.anomaly = OnboardingAnomaly.objects.create(
            user=self.regular_user,
            assignment=self.assignment,
            department=self.department,
            anomaly_type='completion_time',
            severity='medium',
            description='Значительное отклонение от среднего времени выполнения задач',
            threshold=3.0,
            actual_value=4.5,
            recommended_action='Проверить, не нуждается ли сотрудник в дополнительной помощи',
            is_resolved=False
        )

        # Создаем сводку по отделу
        self.department_summary = OnboardingDepartmentSummary.objects.create(
            department=self.department,
            total_users=10,
            active_onboardings=5,
            completed_onboardings=3,
            avg_completion_percentage=68,
            high_risk_users=2,
            health_score=75
        )

        self.client = Client()

    def test_overview_endpoint_authenticated(self):
        """Тест доступа к обзору дашборда для аутентифицированного админа."""
        self.client.force_login(self.admin_user)
        url = reverse('intelligence-dashboard-overview')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn('department_stats', response.data)
        self.assertIn('risk_summary', response.data)
        self.assertIn('recent_anomalies', response.data)

    def test_overview_endpoint_unauthenticated(self):
        """Тест доступа к обзору дашборда для неаутентифицированного пользователя."""
        url = reverse('intelligence-dashboard-overview')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_user_dashboard_endpoint(self):
        """Тест доступа к дашборду пользователя."""
        self.client.force_login(self.admin_user)
        url = reverse('intelligence-dashboard-user',
                      args=[self.regular_user.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user_id'], self.regular_user.id)
        self.assertIn('completion_percentage', response.data)
        self.assertIn('steps_completed', response.data)

    def test_department_dashboard_endpoint(self):
        """Тест доступа к дашборду отдела."""
        self.client.force_login(self.admin_user)
        url = reverse('intelligence-dashboard-department',
                      args=[self.department.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['department_id'], self.department.id)
        self.assertEqual(
            response.data['department_name'], self.department.name)
        self.assertIn('total_users', response.data)
        self.assertIn('avg_completion_percentage', response.data)

    def test_alerts_endpoint(self):
        """Тест доступа к API предупреждений."""
        self.client.force_login(self.admin_user)
        url = reverse('intelligence-dashboard-alerts')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn('high_risk_predictions', response.data)
        self.assertIn('recent_anomalies', response.data)
