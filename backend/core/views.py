from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from .permissions import RoleBasedPermission
from rest_framework import viewsets
from .models import OnboardingPlan, Task
from .serializers import OnboardingPlanSerializer, TaskSerializer


class HealthCheck(APIView):
    def get(self, request):
        return Response({"status": "OK"})


class TestHRView(APIView):
    permission_classes = [RoleBasedPermission]
    required_role = 'hr'

    def get(self, request):
        return Response({"message": "Accessible only to HR"})


class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"status": "valid"})


class OnboardingPlanViewSet(viewsets.ModelViewSet):
    queryset = OnboardingPlan.objects.all()
    serializer_class = OnboardingPlanSerializer
    permission_classes = [RoleBasedPermission]
    required_role = 'hr'


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        if self.request.user.role == 'employee':
            return Task.objects.filter(user=self.request.user)
        return Task.objects.all()
