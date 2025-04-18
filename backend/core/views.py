from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from .permissions import RoleBasedPermission


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
