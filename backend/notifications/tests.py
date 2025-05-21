from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from notifications.models import Notification, NotificationType


class NotificationAPITest(TestCase):
    """
    Тесты для API уведомлений
    """

    def setUp(self):
        # Создаем тестового пользователя
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpassword'
        )

        # Создаем тестовые уведомления
        self.notification1 = Notification.objects.create(
            recipient=self.user,
            title='Test Notification 1',
            message='This is a test notification',
            notification_type=NotificationType.INFO
        )

        self.notification2 = Notification.objects.create(
            recipient=self.user,
            title='Test Notification 2',
            message='This is another test notification',
            notification_type=NotificationType.WARNING
        )

        # Создаем клиент API
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_notifications_list(self):
        """
        Тест получения списка уведомлений
        """
        url = reverse('notification-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_mark_notification_as_read(self):
        """
        Тест отметки уведомления как прочитанное
        """
        url = reverse('notification-read',
                      kwargs={'pk': self.notification1.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_read'])

        # Проверяем, что уведомление действительно отмечено как прочитанное в БД
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)

    def test_mark_all_as_read(self):
        """
        Тест отметки всех уведомлений как прочитанные
        """
        url = reverse('notification-read-all')
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

        # Проверяем, что все уведомления отмечены как прочитанные
        notifications = Notification.objects.filter(recipient=self.user)
        for notification in notifications:
            self.assertTrue(notification.is_read)
