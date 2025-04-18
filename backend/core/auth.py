from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        logger.debug(f"Attempting authentication for username: {username}")

        if username and password:
            try:
                user = User.objects.get(username=username)
                logger.debug(f"Found user: {user}")
                
                if user.check_password(password):
                    logger.debug("Password check passed")
                    return super().validate(attrs)
                else:
                    logger.debug("Password check failed")
                    raise AuthenticationFailed('Invalid password')
            except User.DoesNotExist:
                logger.debug(f"No user found with username: {username}")
                raise AuthenticationFailed('No user found with this username')
        
        logger.debug("Missing username or password")
        raise AuthenticationFailed('Username and password are required')

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer 