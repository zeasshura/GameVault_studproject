"""
Тесты аутентификации и пользователей.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

REGISTER_URL = '/api/auth/register/'
LOGIN_URL = '/api/auth/login/'
REFRESH_URL = '/api/auth/refresh/'
ME_URL = '/api/auth/me/'


@pytest.mark.django_db
class TestRegister:
    """Тесты регистрации пользователя."""

    def test_register_success(self, api_client):
        """Успешная регистрация нового пользователя."""
        payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
        }
        response = api_client.post(REGISTER_URL, payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert 'access' in data
        assert 'refresh' in data
        assert 'user' in data
        assert data['user']['username'] == 'newuser'
        assert data['user']['email'] == 'newuser@example.com'

        # Пользователь действительно создан в БД
        assert User.objects.filter(username='newuser').exists()

    def test_register_duplicate_username(self, api_client, normal_user):
        """Регистрация с уже существующим именем пользователя."""
        payload = {
            'username': normal_user.username,
            'email': 'another@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
        }
        response = api_client.post(REGISTER_URL, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, api_client):
        """Регистрация с несовпадающими паролями."""
        payload = {
            'username': 'testuser2',
            'email': 'testuser2@example.com',
            'password': 'SecurePass123!',
            'password2': 'DifferentPass!',
        }
        response = api_client.post(REGISTER_URL, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_email(self, api_client):
        """Регистрация без email."""
        payload = {
            'username': 'testuser3',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
        }
        response = api_client.post(REGISTER_URL, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    """Тесты входа в систему."""

    def test_login_success(self, api_client, normal_user):
        """Успешный вход с правильными учётными данными."""
        payload = {
            'email': normal_user.email,
            'password': 'UserPass123!',
        }
        response = api_client.post(LOGIN_URL, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'access' in data
        assert 'refresh' in data
        assert data['user']['email'] == normal_user.email

    def test_login_wrong_password(self, api_client, normal_user):
        """Вход с неверным паролем."""
        payload = {
            'email': normal_user.email,
            'password': 'WrongPassword!',
        }
        response = api_client.post(LOGIN_URL, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self, api_client):
        """Вход несуществующего пользователя."""
        payload = {
            'email': 'nonexistent@example.com',
            'password': 'SomePass123!',
        }
        response = api_client.post(LOGIN_URL, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestMeEndpoint:
    """Тесты эндпойнта /api/auth/me/."""

    def test_me_endpoint_authenticated(self, auth_client, normal_user):
        """Аутентифицированный пользователь получает свои данные."""
        response = auth_client.get(ME_URL)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['username'] == normal_user.username
        assert data['email'] == normal_user.email

    def test_me_endpoint_unauthenticated(self, api_client):
        """Неаутентифицированный запрос возвращает 401."""
        response = api_client.get(ME_URL)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestTokenRefresh:
    """Тесты обновления JWT токена."""

    def test_token_refresh(self, api_client, normal_user):
        """Обновление access токена через refresh токен."""
        # Сначала входим
        login_response = api_client.post(LOGIN_URL, {
            'email': normal_user.email,
            'password': 'UserPass123!',
        }, format='json')

        assert login_response.status_code == status.HTTP_200_OK
        refresh_token = login_response.json()['refresh']

        # Обновляем токен
        response = api_client.post(REFRESH_URL, {'refresh': refresh_token}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.json()

    def test_token_refresh_invalid_token(self, api_client):
        """Обновление с неверным refresh токеном."""
        response = api_client.post(REFRESH_URL, {'refresh': 'invalidtoken'}, format='json')

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
