from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для модели пользователя"""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'full_name',
            'position', 'role', 'is_active', 'created_at'
        ]
        read_only_fields = ['created_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Кастомный сериализатор для получения JWT-токенов
    Добавляет дополнительную информацию о пользователе в токен
    и возвращает данные пользователя в ответе
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Добавляем кастомные данные в токен
        token['email'] = user.email
        token['username'] = user.username
        token['full_name'] = user.full_name
        token['role'] = user.role

        return token
        
    def validate(self, attrs):
        # Получаем данные из родительского метода
        data = super().validate(attrs)
        
        # Добавляем данные пользователя в ответ
        user = self.user
        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'username': user.username,
            'full_name': user.full_name,
            'position': user.position,
            'role': user.role,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
        
        return data
