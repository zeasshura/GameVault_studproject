"""
Представления (views) для приложения reviews.
"""

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.games.models import Game
from .models import Review
from .serializers import ReviewSerializer, ReviewWriteSerializer


class MyReviewsView(generics.ListAPIView):
    """
    Получение списка отзывов текущего пользователя.
    GET /api/reviews/my/
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    @extend_schema(
        summary='Мои отзывы',
        description='Возвращает список всех отзывов текущего авторизованного пользователя.'
    )
    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).select_related('game')


class IsAuthorOrAdmin(permissions.BasePermission):
    """
    Разрешение: редактировать/удалять может только автор отзыва или администратор.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user or request.user.role == 'admin'


class GameReviewsView(generics.ListCreateAPIView):
    """
    Список и создание отзывов для конкретной игры.
    GET  /api/games/{game_id}/reviews/
    POST /api/games/{game_id}/reviews/
    """
    pagination_class = None

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewWriteSerializer
        return ReviewSerializer

    def get_game(self):
        """Получает игру по game_id из URL."""
        return get_object_or_404(Game, pk=self.kwargs['game_id'])

    def get_queryset(self):
        game = self.get_game()
        return Review.objects.filter(game=game).select_related('user')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['game'] = self.get_game()
        return context

    @extend_schema(
        summary='Список отзывов на игру',
        description='Возвращает все отзывы для указанной игры.'
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=ReviewWriteSerializer,
        responses={201: ReviewSerializer},
        summary='Добавить отзыв',
        description='Создаёт новый отзыв на игру. Один пользователь — один отзыв.'
    )
    def post(self, request, *args, **kwargs):
        game = self.get_game()
        # Проверяем, нет ли уже отзыва от этого пользователя
        if Review.objects.filter(user=request.user, game=game).exists():
            return Response(
                {'detail': 'Вы уже оставили отзыв на эту игру.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().post(request, *args, **kwargs)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Получение, обновление и удаление конкретного отзыва.
    GET    /api/reviews/{id}/
    PATCH  /api/reviews/{id}/
    DELETE /api/reviews/{id}/
    """

    queryset = Review.objects.all().select_related('user', 'game')
    permission_classes = [permissions.IsAuthenticated, IsAuthorOrAdmin]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAuthorOrAdmin()]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ReviewWriteSerializer
        return ReviewSerializer

    @extend_schema(
        summary='Детали отзыва',
        description='Возвращает подробную информацию об отзыве.'
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=ReviewWriteSerializer,
        responses={200: ReviewSerializer},
        summary='Обновить отзыв',
        description='Обновляет отзыв (только для автора или администратора).'
    )
    def patch(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        summary='Удалить отзыв',
        description='Удаляет отзыв (только для автора или администратора).'
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
