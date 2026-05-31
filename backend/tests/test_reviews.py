"""
Тесты для API рецензий — GameVault
Покрывает: CRUD рецензий, права доступа, пересчёт рейтинга
"""
import pytest
from django.urls import reverse
from rest_framework import status
from apps.reviews.models import Review
from apps.games.models import Game


@pytest.mark.django_db
class TestReviewList:
    """Тесты получения списка рецензий"""

    def test_list_reviews_unauthenticated(self, api_client, sample_game):
        """Неавторизованный пользователь может видеть рецензии"""
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_list_reviews_returns_game_reviews(self, auth_client, normal_user, sample_game):
        """Список возвращает рецензии только для конкретной игры"""
        Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Отличная игра!',
            score=9
        )
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get('results', data)
        assert len(results) == 1

    def test_list_reviews_empty_for_no_reviews(self, api_client, sample_game):
        """Пустой список если нет рецензий"""
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        results = data.get('results', data)
        assert len(results) == 0


@pytest.mark.django_db
class TestReviewCreate:
    """Тесты создания рецензий"""

    def test_create_review_authenticated(self, auth_client, sample_game):
        """Авторизованный пользователь может оставить рецензию"""
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        payload = {'text': 'Хорошая игра', 'score': 8}
        response = auth_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['score'] == 8

    def test_create_review_unauthenticated_forbidden(self, api_client, sample_game):
        """Неавторизованный не может оставить рецензию"""
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        payload = {'text': 'Хорошая игра', 'score': 8}
        response = api_client.post(url, payload, format='json')
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_create_duplicate_review_fails(self, auth_client, normal_user, sample_game):
        """Нельзя оставить вторую рецензию на одну игру"""
        Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Первая рецензия',
            score=7
        )
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        payload = {'text': 'Вторая рецензия', 'score': 5}
        response = auth_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_review_invalid_score_too_high(self, auth_client, sample_game):
        """Оценка не может быть больше 10"""
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        payload = {'text': 'Хорошая игра', 'score': 11}
        response = auth_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_review_invalid_score_too_low(self, auth_client, sample_game):
        """Оценка не может быть меньше 1"""
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        payload = {'text': 'Ужасная игра', 'score': 0}
        response = auth_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestReviewUpdate:
    """Тесты обновления рецензий"""

    def test_update_review_by_author(self, auth_client, normal_user, sample_game):
        """Автор может редактировать свою рецензию"""
        review = Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Старый текст',
            score=5
        )
        url = reverse('review-detail', kwargs={'pk': review.id})
        payload = {'text': 'Новый текст', 'score': 9}
        response = auth_client.put(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        review.refresh_from_db()
        assert review.score == 9
        assert review.text == 'Новый текст'

    def test_update_review_by_non_author_forbidden(self, api_client, admin_user, normal_user, sample_game):
        """Другой пользователь не может редактировать чужую рецензию"""
        review = Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Рецензия автора',
            score=7
        )
        # Логин как другой обычный пользователь
        from apps.users.models import User
        other_user = User.objects.create_user(
            username='other_user',
            email='other@example.com',
            password='testpass123'
        )
        api_client.force_authenticate(user=other_user)
        url = reverse('review-detail', kwargs={'pk': review.id})
        payload = {'text': 'Изменённый текст', 'score': 3}
        response = api_client.put(url, payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_review_by_admin(self, admin_client, normal_user, sample_game):
        """Администратор может редактировать любую рецензию"""
        review = Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Рецензия пользователя',
            score=6
        )
        url = reverse('review-detail', kwargs={'pk': review.id})
        payload = {'text': 'Отредактировано администратором', 'score': 8}
        response = admin_client.put(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestReviewDelete:
    """Тесты удаления рецензий"""

    def test_delete_review_by_author(self, auth_client, normal_user, sample_game):
        """Автор может удалить свою рецензию"""
        review = Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Удаляемая рецензия',
            score=4
        )
        url = reverse('review-detail', kwargs={'pk': review.id})
        response = auth_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Review.objects.filter(pk=review.id).exists()

    def test_delete_review_unauthenticated_forbidden(self, api_client, normal_user, sample_game):
        """Неавторизованный не может удалить рецензию"""
        review = Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Рецензия',
            score=5
        )
        url = reverse('review-detail', kwargs={'pk': review.id})
        response = api_client.delete(url)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_delete_review_by_admin(self, admin_client, normal_user, sample_game):
        """Администратор может удалить любую рецензию"""
        review = Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Рецензия для удаления',
            score=6
        )
        url = reverse('review-detail', kwargs={'pk': review.id})
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestAverageRatingRecalculation:
    """Тесты пересчёта среднего рейтинга игры"""

    def test_avg_rating_recalculated_after_review_create(self, auth_client, normal_user, sample_game):
        """Средний рейтинг обновляется после добавления рецензии"""
        url = reverse('game-reviews-list', kwargs={'game_pk': sample_game.id})
        payload = {'text': 'Хорошая игра', 'score': 8}
        auth_client.post(url, payload, format='json')
        sample_game.refresh_from_db()
        assert sample_game.avg_rating == 8.0

    def test_avg_rating_recalculated_after_multiple_reviews(self, api_client, normal_user, admin_user, sample_game):
        """Средний рейтинг корректен при нескольких рецензиях"""
        Review.objects.create(user=normal_user, game=sample_game, text='Отлично', score=10)
        Review.objects.create(user=admin_user, game=sample_game, text='Нормально', score=6)
        sample_game.refresh_from_db()
        assert sample_game.avg_rating == 8.0

    def test_avg_rating_zero_when_no_reviews(self, sample_game):
        """Рейтинг равен 0 когда нет рецензий"""
        sample_game.refresh_from_db()
        assert sample_game.avg_rating == 0.0

    def test_avg_rating_recalculated_after_review_delete(self, normal_user, admin_user, sample_game):
        """Рейтинг пересчитывается после удаления рецензии"""
        r1 = Review.objects.create(user=normal_user, game=sample_game, text='Хорошо', score=10)
        Review.objects.create(user=admin_user, game=sample_game, text='Плохо', score=4)
        sample_game.refresh_from_db()
        assert sample_game.avg_rating == 7.0
        # Удаляем первую рецензию
        r1.delete()
        sample_game.refresh_from_db()
        assert sample_game.avg_rating == 4.0

    def test_avg_rating_recalculated_after_review_update(self, auth_client, normal_user, sample_game):
        """Рейтинг пересчитывается после редактирования рецензии"""
        review = Review.objects.create(
            user=normal_user,
            game=sample_game,
            text='Рецензия',
            score=6
        )
        sample_game.refresh_from_db()
        assert sample_game.avg_rating == 6.0
        url = reverse('review-detail', kwargs={'pk': review.id})
        auth_client.put(url, {'text': 'Обновлённая', 'score': 10}, format='json')
        sample_game.refresh_from_db()
        assert sample_game.avg_rating == 10.0
