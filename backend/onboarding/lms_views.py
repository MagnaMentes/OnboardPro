from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import OnboardingStep, UserStepProgress
from .permissions import IsAssignedUserOrHRorAdmin
from .lms_models import (
    LMSModule, LMSTest, LMSQuestion, LMSOption, LMSUserAnswer, LMSUserTestResult
)
from gamification.services import GamificationService
from .lms_serializers import (
    LMSModuleSerializer, LMSTestSerializer, TestSubmitSerializer, LMSUserTestResultSerializer
)


class LMSModuleListView(generics.ListAPIView):
    """
    Представление для получения списка обучающих модулей для шага онбординга
    """
    serializer_class = LMSModuleSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def get_queryset(self):
        step_id = self.kwargs.get('step_id')
        step = get_object_or_404(OnboardingStep, pk=step_id)
        self.check_object_permissions(
            self.request, self._get_assignment_for_check(step))
        return LMSModule.objects.filter(step_id=step_id).order_by('order')

    def _get_assignment_for_check(self, step):
        """
        Вспомогательный метод для получения назначения для проверки разрешений
        """
        from .models import UserOnboardingAssignment
        return UserOnboardingAssignment.objects.filter(
            user=self.request.user,
            program=step.program
        ).first()


class LMSTestDetailView(generics.RetrieveAPIView):
    """
    Представление для получения теста для шага онбординга
    """
    serializer_class = LMSTestSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def get_object(self):
        step_id = self.kwargs.get('step_id')
        step = get_object_or_404(OnboardingStep, pk=step_id)
        self.check_object_permissions(
            self.request, self._get_assignment_for_check(step))
        return get_object_or_404(LMSTest, step_id=step_id)

    def _get_assignment_for_check(self, step):
        """
        Вспомогательный метод для получения назначения для проверки разрешений
        """
        from .models import UserOnboardingAssignment
        return UserOnboardingAssignment.objects.filter(
            user=self.request.user,
            program=step.program
        ).first()


class LMSTestSubmitView(generics.GenericAPIView):
    """
    Представление для отправки ответов на тест
    """
    serializer_class = TestSubmitSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def post(self, request, step_id):
        """
        Обработка отправки ответов на тест
        """
        step = get_object_or_404(OnboardingStep, pk=step_id)
        self.check_object_permissions(
            request, self._get_assignment_for_check(step))

        # Проверяем, что пользователь еще не прошел этот тест
        test = get_object_or_404(LMSTest, step_id=step_id)
        if LMSUserTestResult.objects.filter(user=request.user, test=test).exists():
            return Response(
                {"detail": "Вы уже прошли этот тест и не можете отправить ответы повторно."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем и сохраняем ответы
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request, 'step_id': step_id}
        )
        serializer.is_valid(raise_exception=True)
        test_result = serializer.save()

        # Возвращаем результат теста
        result_serializer = LMSUserTestResultSerializer(test_result)

        # Интеграция с GamificationService
        try:
            GamificationService.handle_test_completion(
                request.user, test_result)
        except Exception as e:
            # Логируем ошибку, но не прерываем основной процесс
            print(f"Error in GamificationService.handle_test_completion: {e}")

        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    def _get_assignment_for_check(self, step):
        """
        Вспомогательный метод для получения назначения для проверки разрешений
        """
        from .models import UserOnboardingAssignment
        return UserOnboardingAssignment.objects.filter(
            user=self.request.user,
            program=step.program
        ).first()


class LMSUserTestResultView(generics.RetrieveAPIView):
    """
    Представление для получения результата прохождения теста пользователем
    """
    serializer_class = LMSUserTestResultSerializer
    permission_classes = [
        permissions.IsAuthenticated, IsAssignedUserOrHRorAdmin]

    def get_object(self):
        step_id = self.kwargs.get('step_id')
        step = get_object_or_404(OnboardingStep, pk=step_id)
        self.check_object_permissions(
            self.request, self._get_assignment_for_check(step))

        test = get_object_or_404(LMSTest, step_id=step_id)
        return get_object_or_404(LMSUserTestResult, user=self.request.user, test=test)

    def _get_assignment_for_check(self, step):
        """
        Вспомогательный метод для получения назначения для проверки разрешений
        """
        from .models import UserOnboardingAssignment
        return UserOnboardingAssignment.objects.filter(
            user=self.request.user,
            program=step.program
        ).first()
