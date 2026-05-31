"""
Тесты для приложения games.
"""

import pytest
from rest_framework import status

from apps.games.models import Game, Genre, Platform, GameGenre, GamePlatform

GAMES_URL = '/api/games/'
GENRES_URL = '/api/games/genres/'
PLATFORMS_URL = '/api/games/platforms/'


@pytest.mark.django_db
class TestGameList:
    """Тесты получения списка игр."""

    def test_list_games(self, api_client, sample_game):
        """Список игр доступен без аутентификации."""
        response = api_client.get(GAMES_URL)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'results' in data
        assert data['count'] >= 1

    def test_list_games_pagination(self, api_client, db, sample_genre, sample_platform):
        """Список игр возвращается с пагинацией."""
        # Создаём 15 игр
        for i in range(15):
            game = Game.objects.create(title=f'Game {i}', avg_rating=0.0)
            GameGenre.objects.create(game=game, genre=sample_genre)
            GamePlatform.objects.create(game=game, platform=sample_platform)

        response = api_client.get(GAMES_URL)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # По умолчанию 10 игр на странице
        assert len(data['results']) <= 10
        assert 'next' in data


@pytest.mark.django_db
class TestGameDetail:
    """Тесты получения детальной информации об игре."""

    def test_get_game_detail(self, api_client, sample_game):
        """Детали игры доступны без аутентификации."""
        url = f'{GAMES_URL}{sample_game.id}/'
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['id'] == sample_game.id
        assert data['title'] == sample_game.title
        assert 'description' in data
        assert 'genres' in data
        assert 'platforms' in data

    def test_get_nonexistent_game(self, api_client):
        """Запрос несуществующей игры возвращает 404."""
        response = api_client.get(f'{GAMES_URL}99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestGameCRUD:
    """Тесты создания, обновления и удаления игр."""

    def test_create_game_as_admin(self, admin_client, sample_genre, sample_platform):
        """Администратор может создавать игры."""
        payload = {
            'title': 'New Admin Game',
            'description': 'Created by admin.',
            'release_date': '2024-06-15',
            'genre_ids': [sample_genre.id],
            'platform_ids': [sample_platform.id],
        }
        response = admin_client.post(GAMES_URL, payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['title'] == 'New Admin Game'
        assert Game.objects.filter(title='New Admin Game').exists()

    def test_create_game_as_user_forbidden(self, auth_client, sample_genre, sample_platform):
        """Обычный пользователь не может создавать игры."""
        payload = {
            'title': 'Forbidden Game',
            'description': 'Should not be created.',
            'genre_ids': [sample_genre.id],
            'platform_ids': [sample_platform.id],
        }
        response = auth_client.post(GAMES_URL, payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_game_unauthenticated_forbidden(self, api_client):
        """Неаутентифицированный запрос возвращает 403."""
        payload = {'title': 'No Auth Game'}
        response = api_client.post(GAMES_URL, payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_game_as_admin(self, admin_client, sample_game):
        """Администратор может обновлять игру."""
        url = f'{GAMES_URL}{sample_game.id}/'
        payload = {'title': 'Updated Title'}
        response = admin_client.patch(url, payload, format='json')

        assert response.status_code == status.HTTP_200_OK
        sample_game.refresh_from_db()
        assert sample_game.title == 'Updated Title'

    def test_delete_game_as_admin(self, admin_client, sample_game):
        """Администратор может удалять игры."""
        url = f'{GAMES_URL}{sample_game.id}/'
        response = admin_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Game.objects.filter(id=sample_game.id).exists()

    def test_delete_game_as_user_forbidden(self, auth_client, sample_game):
        """Обычный пользователь не может удалять игры."""
        url = f'{GAMES_URL}{sample_game.id}/'
        response = auth_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Game.objects.filter(id=sample_game.id).exists()


@pytest.mark.django_db
class TestGameFilters:
    """Тесты фильтрации и поиска игр."""

    def test_filter_games_by_genre(self, api_client, sample_game, sample_genre):
        """Фильтрация игр по жанру."""
        response = api_client.get(GAMES_URL, {'genre_id': sample_genre.id})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] >= 1
        game_ids = [g['id'] for g in data['results']]
        assert sample_game.id in game_ids

    def test_filter_games_by_platform(self, api_client, sample_game, sample_platform):
        """Фильтрация игр по платформе."""
        response = api_client.get(GAMES_URL, {'platform_id': sample_platform.id})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] >= 1

    def test_search_games(self, api_client, sample_game):
        """Поиск игр по названию."""
        response = api_client.get(GAMES_URL, {'search': 'Test Game'})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] >= 1
        assert any(g['title'] == 'Test Game' for g in data['results'])

    def test_search_games_no_results(self, api_client, sample_game):
        """Поиск несуществующей игры."""
        response = api_client.get(GAMES_URL, {'search': 'XYZ_Nonexistent_Game_12345'})

        assert response.status_code == status.HTTP_200_OK
        assert response.json()['count'] == 0

    def test_filter_by_min_rating(self, api_client, sample_game):
        """Фильтрация по минимальному рейтингу."""
        # Устанавливаем рейтинг
        sample_game.avg_rating = 7.5
        sample_game.save()

        response = api_client.get(GAMES_URL, {'min_rating': 7.0})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['count'] >= 1
