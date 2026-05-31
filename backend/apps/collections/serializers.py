"""
Сериализаторы для приложения collections.
"""

from rest_framework import serializers
from apps.games.serializers import GameListSerializer
from .models import Collection, CollectionGame


class CollectionGameSerializer(serializers.ModelSerializer):
    """Сериализатор игры в коллекции."""

    game = GameListSerializer(read_only=True)
    game_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CollectionGame
        fields = ('id', 'game', 'game_id')


class CollectionSerializer(serializers.ModelSerializer):
    """
    Сериализатор коллекции со списком игр.
    """

    games = serializers.SerializerMethodField()
    user = serializers.StringRelatedField(read_only=True)
    games_count = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ('id', 'user', 'name', 'games', 'games_count', 'created_at')
        read_only_fields = ('id', 'user', 'created_at', 'games', 'games_count')

    def get_games(self, obj):
        """Возвращает список игр в коллекции."""
        collection_games = obj.collection_games.select_related('game').all()
        games = [cg.game for cg in collection_games]
        return GameListSerializer(games, many=True, context=self.context).data

    def get_games_count(self, obj):
        """Возвращает количество игр в коллекции."""
        return obj.collection_games.count()

    def create(self, validated_data):
        """Создаёт коллекцию для текущего пользователя."""
        user = validated_data.pop('user', None) or self.context['request'].user
        return Collection.objects.create(user=user, **validated_data)


class AddGameToCollectionSerializer(serializers.Serializer):
    """Сериализатор для добавления игры в коллекцию."""

    game_id = serializers.IntegerField(required=True)

    def validate_game_id(self, value):
        from apps.games.models import Game
        if not Game.objects.filter(id=value).exists():
            raise serializers.ValidationError(f'Игра с ID {value} не найдена.')
        return value
