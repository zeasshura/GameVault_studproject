"""
pytest конфигурация и фикстуры для тестирования GameVault.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.games.models import Game, Genre, Platform, GameGenre, GamePlatform

User = get_user_model()


@pytest.fixture
def api_client():
    """Возвращает неаутентифицированный APIClient."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Создаёт пользователя с ролью 'admin'."""
    user = User.objects.create_user(
        username='admin_user',
        email='admin@gamevault.test',
        password='AdminPass123!',
        role='admin',
    )
    return user


@pytest.fixture
def normal_user(db):
    """Создаёт обычного пользователя с ролью 'user'."""
    user = User.objects.create_user(
        username='normal_user',
        email='user@gamevault.test',
        password='UserPass123!',
        role='user',
    )
    return user


@pytest.fixture
def auth_client(api_client, normal_user):
    """Возвращает APIClient, аутентифицированный как обычный пользователь."""
    refresh = RefreshToken.for_user(normal_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Возвращает APIClient, аутентифицированный как администратор."""
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return api_client


@pytest.fixture
def sample_genre(db):
    """Создаёт тестовый жанр."""
    return Genre.objects.create(name='Action')


@pytest.fixture
def sample_platform(db):
    """Создаёт тестовую платформу."""
    return Platform.objects.create(name='PC')


@pytest.fixture
def sample_game(db, sample_genre, sample_platform):
    """Создаёт тестовую игру со связанными жанром и платформой."""
    game = Game.objects.create(
        title='Test Game',
        description='A test game description.',
        release_date='2023-01-01',
        cover_url='https://example.com/cover.jpg',
        avg_rating=0.0,
    )
    GameGenre.objects.create(game=game, genre=sample_genre)
    GamePlatform.objects.create(game=game, platform=sample_platform)
    return game
