"""
URL маршруты для приложения reviews.
"""

from django.urls import path
from .views import GameReviewsView, ReviewDetailView, MyReviewsView

urlpatterns = [
    # Мои отзывы
    path('my/', MyReviewsView.as_view(), name='my-reviews'),

    # Отзывы к конкретной игре (список + создание)
    path('games/<int:game_id>/reviews/', GameReviewsView.as_view(), name='game-reviews'),

    # Операции с конкретным отзывом
    path('<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
]
