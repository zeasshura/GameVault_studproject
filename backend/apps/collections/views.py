"""
Представления (views) для приложения collections.
"""

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.games.models import Game
from .models import Collection, CollectionGame
from .serializers import CollectionSerializer, AddGameToCollectionSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления коллекциями игр.

    Пользователи могут управлять только своими коллекциями.
    Поддерживает добавление и удаление игр из коллекции.
    """

    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        """Возвращает только коллекции текущего пользователя."""
        return Collection.objects.filter(
            user=self.request.user
        ).prefetch_related('collection_games__game')

    def perform_create(self, serializer):
        """Устанавливает текущего пользователя при создании коллекции."""
        serializer.save(user=self.request.user)

    @extend_schema(
        summary='Мои коллекции',
        description='Возвращает список коллекций текущего пользователя.'
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary='Создать коллекцию',
        description='Создаёт новую коллекцию игр для текущего пользователя.'
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        request=AddGameToCollectionSerializer,
        responses={200: CollectionSerializer},
        summary='Добавить игру в коллекцию',
        description='Добавляет игру в указанную коллекцию.'
    )
    @action(detail=True, methods=['post'], url_path='games')
    def add_game(self, request, pk=None):
        """
        POST /api/collections/{id}/games/
        Добавляет игру в коллекцию.
        Body: {"game_id": 123}
        """
        collection = self.get_object()

        serializer = AddGameToCollectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        game_id = serializer.validated_data['game_id']
        game = get_object_or_404(Game, id=game_id)

        # Проверяем, не добавлена ли уже игра
        if CollectionGame.objects.filter(collection=collection, game=game).exists():
            return Response(
                {'detail': 'Игра уже в этой коллекции.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        CollectionGame.objects.create(collection=collection, game=game)

        # Возвращаем обновлённую коллекцию
        collection.refresh_from_db()
        return Response(
            CollectionSerializer(collection, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

    @extend_schema(
        parameters=[
            OpenApiParameter('game_id', OpenApiTypes.INT, location='path', description='ID игры')
        ],
        summary='Удалить игру из коллекции',
        description='Удаляет игру из указанной коллекции.'
    )
    @action(detail=True, methods=['delete'], url_path='games/(?P<game_id>[0-9]+)')
    def remove_game(self, request, pk=None, game_id=None):
        """
        DELETE /api/collections/{id}/games/{game_id}/
        Удаляет игру из коллекции.
        """
        collection = self.get_object()
        game = get_object_or_404(Game, id=game_id)

        deleted_count, _ = CollectionGame.objects.filter(
            collection=collection,
            game=game
        ).delete()

        if deleted_count == 0:
            return Response(
                {'detail': 'Игра не найдена в этой коллекции.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {'detail': f'Игра "{game.title}" удалена из коллекции.'},
            status=status.HTTP_200_OK
        )
