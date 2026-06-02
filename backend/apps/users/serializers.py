"""
Сериализаторы для приложения users.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации нового пользователя."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Подтверждение пароля'
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2', 'bio', 'avatar_url')
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate_email(self, value):
        """Проверяет уникальность email."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже существует.')
        return value

    def validate_username(self, value):
        """Проверяет уникальность username."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Пользователь с таким именем уже существует.')
        return value

    def validate(self, attrs):
        """Проверяет совпадение паролей."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Пароли не совпадают.'})
        return attrs

    def create(self, validated_data):
        """Создаёт нового пользователя."""
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для чтения профиля пользователя."""

    is_admin = serializers.BooleanField(read_only=True)
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'bio', 'avatar_url', 'is_admin', 'date_joined'
        )
        read_only_fields = ('id', 'role', 'date_joined', 'is_admin')

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)


class LoginSerializer(serializers.Serializer):
    """Сериализатор для входа в систему."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Проверяет учётные данные пользователя."""
        email = attrs.get('email')
        password = attrs.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Неверный email или пароль.')

        if not user.check_password(password):
            raise serializers.ValidationError('Неверный email или пароль.')

        if not user.is_active:
            raise serializers.ValidationError('Аккаунт деактивирован.')

        attrs['user'] = user
        return attrs


class TokenResponseSerializer(serializers.Serializer):
    """Сериализатор ответа с JWT токенами."""

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
