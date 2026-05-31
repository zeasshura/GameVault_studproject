"""
Тесты для API коллекций — GameVault
Покрывает: CRUD коллекций, добавление/удаление игр, изоляция данных
"""
import pytest
from django.urls import reverse
from rest_framework import status
from apps.collections.models import Collection, CollectionGame
from apps.users.models import User


@pytest.mark.django_db
class TestCollectionList:
    """Тесты получения списка коллекций"""

    def test_list_collections_authenticated(self, auth_client, normal_user):
        """Авторизованный пользователь видит свои коллекции"""
        Collection.objects.create(user=normal_user, name='Играю')
        Collection.objects.create(user=normal_user, name='Прошёл')
        url = reverse('collection-list')
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get('results', data)
        assert len(results) == 2

    def test_list_collections_unauthenticated_forbidden(self, api_client):
        """Неавторизованный не может просмотреть коллекции"""
        url = reverse('collection-list')
        response = api_client.get(url)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_collection_only_visible_to_owner(self, auth_client, normal_user, admin_user):
        """Пользователь видит только свои коллекции"""
        Collection.objects.create(user=normal_user, name='Моя коллекция')
        Collection.objects.create(user=admin_user, name='Коллекция админа')
        url = reverse('collection-list')
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get('results', data)
        # Должна быть только коллекция normal_user
        assert len(results) == 1
        assert results[0]['name'] == 'Моя коллекция'


@pytest.mark.django_db
class TestCollectionCreate:
    """Тесты создания коллекций"""

    def test_create_collection_authenticated(self, auth_client, normal_user):
        """Авторизованный пользователь может создать коллекцию"""
        url = reverse('collection-list')
        payload = {'name': 'Хочу пройти'}
        response = auth_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Хочу пройти'
        assert Collection.objects.filter(user=normal_user, name='Хочу пройти').exists()

    def test_create_collection_unauthenticated_forbidden(self, api_client):
        """Неавторизованный не может создать коллекцию"""
        url = reverse('collection-list')
        payload = {'name': 'Тестовая'}
        response = api_client.post(url, payload, format='json')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_create_collection_sets_current_user(self, auth_client, normal_user):
        """Коллекция автоматически привязывается к текущему пользователю"""
        url = reverse('collection-list')
        payload = {'name': 'Играю'}
        auth_client.post(url, payload, format='json')
        collection = Collection.objects.get(name='Играю')
        assert collection.user == normal_user


@pytest.mark.django_db
class TestCollectionGames:
    """Тесты управления играми в коллекции"""

    def test_add_game_to_collection(self, auth_client, normal_user, sample_game):
        """Пользователь может добавить игру в свою коллекцию"""
        collection = Collection.objects.create(user=normal_user, name='Играю')
        url = reverse('collection-add-game', kwargs={'pk': collection.id})
        payload = {'game_id': sample_game.id}
        response = auth_client.post(url, payload, format='json')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        assert CollectionGame.objects.filter(
            collection=collection,
            game=sample_game
        ).exists()

    def test_add_same_game_twice_fails(self, auth_client, normal_user, sample_game):
        """Нельзя добавить одну игру дважды в одну коллекцию"""
        collection = Collection.objects.create(user=normal_user, name='Играю')
        CollectionGame.objects.create(collection=collection, game=sample_game)
        url = reverse('collection-add-game', kwargs={'pk': collection.id})
        payload = {'game_id': sample_game.id}
        response = auth_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_remove_game_from_collection(self, auth_client, normal_user, sample_game):
        """Пользователь может убрать игру из коллекции"""
        collection = Collection.objects.create(user=normal_user, name='Играю')
        CollectionGame.objects.create(collection=collection, game=sample_game)
        url = reverse('collection-remove-game', kwargs={'pk': collection.id, 'game_id': sample_game.id})
        response = auth_client.delete(url)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]
        assert not CollectionGame.objects.filter(
            collection=collection,
            game=sample_game
        ).exists()

    def test_remove_nonexistent_game_returns_404(self, auth_client, normal_user, sample_game):
        """Удаление несуществующей игры из коллекции — 404"""
        collection = Collection.objects.create(user=normal_user, name='Играю')
        url = reverse('collection-remove-game', kwargs={'pk': collection.id, 'game_id': sample_game.id})
        response = auth_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cannot_add_game_to_others_collection(self, api_client, normal_user, admin_user, sample_game):
        """Нельзя добавить игру в чужую коллекцию"""
        collection = Collection.objects.create(user=admin_user, name='Коллекция админа')
        # Логинимся как обычный пользователь
        api_client.force_authenticate(user=normal_user)
        url = reverse('collection-add-game', kwargs={'pk': collection.id})
        payload = {'game_id': sample_game.id}
        response = api_client.post(url, payload, format='json')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]


@pytest.mark.django_db
class TestCollectionDetail:
    """Тесты получения деталей коллекции"""

    def test_get_collection_detail(self, auth_client, normal_user, sample_game):
        """Пользователь может просмотреть свою коллекцию с играми"""
        collection = Collection.objects.create(user=normal_user, name='Прошёл')
        CollectionGame.objects.create(collection=collection, game=sample_game)
        url = reverse('collection-detail', kwargs={'pk': collection.id})
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Прошёл'

    def test_get_others_collection_forbidden(self, api_client, normal_user, admin_user):
        """Нельзя просмотреть чужую коллекцию"""
        collection = Collection.objects.create(user=admin_user, name='Секретная коллекция')
        api_client.force_authenticate(user=normal_user)
        url = reverse('collection-detail', kwargs={'pk': collection.id})
        response = api_client.get(url)
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
