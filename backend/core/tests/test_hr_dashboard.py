import json
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User, UserRole
from departments.models import Department
from ..models.hr_dashboard import HRMetricSnapshot, HRAlert, HRAlertRule
from ..services.hr_dashboard import HRDashboardAggregatorService, HRRealTimeAlertService


class HRDashboardTests(APITestCase):
    """
    Тесты для API HR-дашборда
    """

    def setUp(self):
        # Создаем тестовых пользователей
        self.hr_user = User.objects.create_user(
            email='hr@test.com',
            password='testpass123',
            role=UserRole.HR
        )
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role=UserRole.ADMIN
        )
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='testpass123',
            role=UserRole.EMPLOYEE
        )

        # Создаем тестовый департамент
        self.department = Department.objects.create(
            name='Test Department'
        )

        # Создаем тестовые метрики
        self.metric = HRMetricSnapshot.objects.create(
            metric_key='test_metric',
            metric_value=42.0,
            department=self.department
        )

        # Создаем тестовое правило
        self.rule = HRAlertRule.objects.create(
            name='Test Rule',
            description='Test Description',
            severity=HRAlertRule.Severity.HIGH,
            metric_key='test_metric',
            threshold_value=50.0,
            comparison='gt'
        )

        # Создаем тестовый алерт
        self.alert = HRAlert.objects.create(
            title='Test Alert',
            message='Test Message',
            rule=self.rule,
            severity=HRAlertRule.Severity.HIGH,
            status=HRAlert.Status.OPEN
        )

    def test_overview_endpoint(self):
        """
        Тест endpoint'а общего обзора
        """
        # Авторизуемся как HR
        self.client.force_authenticate(user=self.hr_user)

        url = reverse('hr-dashboard-overview')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('active_onboarding_count', response.data)
        self.assertIn('avg_completion_rate', response.data)
        self.assertIn('open_alerts_count', response.data)

    def test_department_metrics_endpoint(self):
        """
        Тест endpoint'а метрик департаментов
        """
        self.client.force_authenticate(user=self.hr_user)

        url = reverse('department-metrics')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))
        if response.data:
            dept_data = response.data[0]
            self.assertIn('department_id', dept_data)
            self.assertIn('department_name', dept_data)
            self.assertIn('active_employees', dept_data)

    def test_alert_list_endpoint(self):
        """
        Тест endpoint'а списка алертов
        """
        self.client.force_authenticate(user=self.hr_user)

        url = reverse('hralert-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))
        if response.data:
            alert_data = response.data[0]
            self.assertEqual(alert_data['title'], 'Test Alert')
            self.assertEqual(alert_data['severity'], HRAlertRule.Severity.HIGH)

    def test_alert_resolve_endpoint(self):
        """
        Тест endpoint'а резолюции алерта
        """
        self.client.force_authenticate(user=self.hr_user)

        url = reverse('hralert-resolve', args=[self.alert.id])
        data = {'notes': 'Resolution notes'}
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], HRAlert.Status.RESOLVED)
        self.assertIsNotNone(response.data['resolved_at'])

    def test_alert_rule_crud(self):
        """
        Тест CRUD операций для правил алертов
        """
        self.client.force_authenticate(user=self.admin_user)

        # Create
        url = reverse('hralertrule-list')
        data = {
            'name': 'New Rule',
            'description': 'New Description',
            'severity': HRAlertRule.Severity.MEDIUM,
            'metric_key': 'new_metric',
            'threshold_value': 75.0,
            'comparison': 'gt'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        rule_id = response.data['id']

        # Read
        response = self.client.get(f"{url}{rule_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'New Rule')

        # Update
        data['name'] = 'Updated Rule'
        response = self.client.put(f"{url}{rule_id}/", data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Rule')

        # Delete
        response = self.client.delete(f"{url}{rule_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_unauthorized_access(self):
        """
        Тест доступа неавторизованных пользователей
        """
        # Не авторизован
        url = reverse('hr-dashboard-overview')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Обычный пользователь
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class HRDashboardServicesTests(TestCase):
    """
    Тесты для сервисов HR-дашборда
    """

    def setUp(self):
        self.department = Department.objects.create(
            name='Test Department'
        )
        self.rule = HRAlertRule.objects.create(
            name='Test Rule',
            description='Test Description',
            severity=HRAlertRule.Severity.HIGH,
            metric_key='test_metric',
            threshold_value=50.0,
            comparison='gt',
            is_active=True
        )

    def test_metric_collection(self):
        """
        Тест сбора метрик
        """
        metrics = HRDashboardAggregatorService.collect_metrics()

        self.assertIsInstance(metrics, dict)
        self.assertIn('active_onboarding_count', metrics)
        self.assertIn('avg_completion_rate', metrics)
        self.assertIn('negative_feedback_rate', metrics)

    def test_alert_rule_checking(self):
        """
        Тест проверки правил алертов
        """
        # Создаем метрику, превышающую порог
        HRMetricSnapshot.objects.create(
            metric_key='test_metric',
            metric_value=75.0
        )

        # Проверяем правила
        HRRealTimeAlertService.check_alert_rules()

        # Проверяем, что создан алерт
        self.assertTrue(
            HRAlert.objects.filter(
                rule=self.rule,
                status=HRAlert.Status.OPEN
            ).exists()
        )

    def test_metric_snapshot_creation(self):
        """
        Тест создания снэпшота метрик
        """
        initial_count = HRMetricSnapshot.objects.count()

        # Создаем снэпшот
        HRDashboardAggregatorService.store_current_snapshot()

        # Проверяем, что появились новые метрики
        self.assertTrue(
            HRMetricSnapshot.objects.count() > initial_count
        )
