from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import UserReward, UserLevel
from .services import GamificationService

User = get_user_model()


class GamificationServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )

    def test_get_or_create_user_level(self):
        # Проверяем создание уровня пользователя
        user_level = GamificationService.get_or_create_user_level(self.user)
        self.assertEqual(user_level.level, 1)
        self.assertEqual(user_level.points, 0)

        # Проверяем получение существующего уровня
        same_level = GamificationService.get_or_create_user_level(self.user)
        self.assertEqual(user_level.id, same_level.id)

    def test_add_points_and_level_up(self):
        # Проверяем начисление очков и повышение уровня
        user_level, points = GamificationService.add_points(
            self.user, 'step_completion', 5)
        expected_points = GamificationService.POINTS_CONFIG['step_completion'] * 5

        self.assertEqual(user_level.points, expected_points)
        self.assertEqual(points, expected_points)

        # Проверяем повышение уровня при достаточном количестве очков
        points_for_level_2 = GamificationService.LEVEL_THRESHOLDS[2]
        steps_needed = (
            points_for_level_2 - expected_points) // GamificationService.POINTS_CONFIG['step_completion'] + 1

        user_level, _ = GamificationService.add_points(
            self.user, 'step_completion', steps_needed)
        self.assertEqual(user_level.level, 2)

    def test_achievement_award(self):
        # Проверяем выдачу достижения
        reward, is_new = GamificationService.award_achievement(
            self.user, 'first_step')

        self.assertTrue(is_new)
        self.assertEqual(reward.reward_type, UserReward.RewardType.ACHIEVEMENT)
        self.assertEqual(
            reward.title, GamificationService.KEY_ACHIEVEMENTS['first_step']['title'])

        # Проверяем, что повторное получение того же достижения невозможно
        duplicate_reward, is_new = GamificationService.award_achievement(
            self.user, 'first_step')
        self.assertFalse(is_new)
        self.assertEqual(reward.id, duplicate_reward.id)

    def test_level_up_reward(self):
        # Проверяем создание награды при повышении уровня
        new_level = 3
        old_level = 2
        reward = GamificationService.award_level_up(
            self.user, new_level, old_level)

        self.assertEqual(reward.reward_type, UserReward.RewardType.LEVEL)
        self.assertEqual(reward.title, f'Уровень {new_level}')
        self.assertEqual(reward.icon, f'level_{new_level}')

    def test_handle_step_completion(self):
        # Проверяем обработку завершения шага
        from onboarding.models import OnboardingStep, OnboardingProgram, UserOnboardingAssignment, UserStepProgress

        # Создаем программу и шаг
        program = OnboardingProgram.objects.create(
            name="Test Program",
            description="Test Description",
            author=self.user
        )
        step = OnboardingStep.objects.create(
            name="Test Step",
            program=program,
            order=1
        )
        assignment = UserOnboardingAssignment.objects.create(
            user=self.user,
            program=program
        )
        step_progress = UserStepProgress.objects.create(
            user=self.user,
            step=step,
            status='done'
        )

        # Проверяем обработку первого шага
        user_level, points = GamificationService.handle_step_completion(
            self.user, step)

        self.assertEqual(
            points, GamificationService.POINTS_CONFIG['step_completion'])
        self.assertTrue(
            UserReward.objects.filter(
                user=self.user,
                title=GamificationService.KEY_ACHIEVEMENTS['first_step']['title']
            ).exists()
        )

    def test_handle_test_completion(self):
        # Проверяем обработку завершения теста
        from onboarding.lms_models import LMSTest, LMSUserTestResult

        test = LMSTest.objects.create(
            title="Test Quiz",
            description="Test Description"
        )
        test_result = LMSUserTestResult.objects.create(
            user=self.user,
            test=test,
            is_passed=True,
            score=100,
            max_score=100
        )

        user_level, points = GamificationService.handle_test_completion(
            self.user, test_result)

        self.assertEqual(
            points, GamificationService.POINTS_CONFIG['test_completion'])
        self.assertTrue(
            UserReward.objects.filter(
                user=self.user,
                title=GamificationService.KEY_ACHIEVEMENTS['perfect_test']['title']
            ).exists()
        )

    def test_handle_feedback_submission(self):
        # Проверяем обработку отправки фидбека
        from onboarding.feedback_models import StepFeedback

        feedback = StepFeedback.objects.create(
            user=self.user,
            comment="Test feedback"
        )

        user_level, points = GamificationService.handle_feedback_submission(
            self.user, feedback)

        self.assertEqual(
            points, GamificationService.POINTS_CONFIG['feedback_submission'])

        # Создаем еще 9 фидбеков для проверки получения награды
        for _ in range(9):
            StepFeedback.objects.create(
                user=self.user,
                comment="Test feedback"
            )
            GamificationService.handle_feedback_submission(self.user, feedback)

        self.assertTrue(
            UserReward.objects.filter(
                user=self.user,
                title=GamificationService.KEY_ACHIEVEMENTS['feedback_king']['title']
            ).exists()
        )


class GamificationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        self.client.force_authenticate(user=self.user)
        self.user_level = GamificationService.get_or_create_user_level(
            self.user)

        # Создаем тестовые награды
        self.test_reward = UserReward.objects.create(
            user=self.user,
            reward_type=UserReward.RewardType.ACHIEVEMENT,
            title="Test Achievement",
            description="Test Description",
            icon="test_icon"
        )

    def test_get_profile(self):
        """Тест получения профиля геймификации"""
        url = reverse('gamification-profile')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['level'], self.user_level.level)
        self.assertEqual(response.data['points'], self.user_level.points)

    def test_get_achievements(self):
        """Тест получения списка достижений"""
        url = reverse('gamification-achievements')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertEqual(response.data[0]['title'], self.test_reward.title)

    def test_track_event(self):
        """Тест отправки события для трекинга"""
        url = reverse('gamification-events')
        data = {
            'event_type': 'step_completion',
            'count': 1
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('points' in response.data)
        self.assertTrue('level' in response.data)

    def test_unauthorized_access(self):
        """Тест доступа без авторизации"""
        self.client.logout()
        url = reverse('gamification-profile')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
