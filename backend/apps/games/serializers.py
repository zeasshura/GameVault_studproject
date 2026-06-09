"""
Сериализаторы для приложения games.
"""

from rest_framework import serializers
from .models import Game, Genre, Platform, GameGenre, GamePlatform


class GenreSerializer(serializers.ModelSerializer):
    """Сериализатор жанра."""

    class Meta:
        model = Genre
        fields = ('id', 'name')


class PlatformSerializer(serializers.ModelSerializer):
    """Сериализатор платформы."""

    class Meta:
        model = Platform
        fields = ('id', 'name')


class GameListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для списка игр (без полного описания).
    Используется при GET /api/games/
    """

    genres = GenreSerializer(many=True, read_only=True)
    platforms = PlatformSerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = (
            'id', 'rawg_id', 'title', 'cover_url', 'video_url', 'avg_rating',
            'release_date', 'genres', 'platforms', 'created_at'
        )


class GameDetailSerializer(serializers.ModelSerializer):
    """
    Детальный сериализатор игры (все поля).
    Используется при GET /api/games/{id}/
    """

    genres = GenreSerializer(many=True, read_only=True)
    platforms = PlatformSerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = (
            'id', 'rawg_id', 'title', 'description', 'release_date',
            'cover_url', 'video_url', 'avg_rating', 'initial_rating',
            'initial_rating_count', 'genres', 'platforms', 'created_at'
        )


class GameWriteSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания/обновления игры.
    Принимает IDs жанров и платформ.
    """

    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='genres'
    )
    platform_ids = serializers.PrimaryKeyRelatedField(
        queryset=Platform.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='platforms'
    )

    class Meta:
        model = Game
        fields = (
            'id', 'title', 'description', 'cover_url', 'video_url',
            'release_date', 'rawg_id', 'genre_ids', 'platform_ids'
        )

    def create(self, validated_data):
        genres = validated_data.pop('genres', [])
        platforms = validated_data.pop('platforms', [])
        game = Game.objects.create(**validated_data)

        # Устанавливаем жанры через промежуточную таблицу
        for genre in genres:
            GameGenre.objects.get_or_create(game=game, genre=genre)

        # Устанавливаем платформы через промежуточную таблицу
        for platform in platforms:
            GamePlatform.objects.get_or_create(game=game, platform=platform)

        return game

    def update(self, instance, validated_data):
        genres = validated_data.pop('genres', None)
        platforms = validated_data.pop('platforms', None)

        # Обновляем основные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Обновляем жанры если переданы
        if genres is not None:
            GameGenre.objects.filter(game=instance).delete()
            for genre in genres:
                GameGenre.objects.get_or_create(game=instance, genre=genre)

        # Обновляем платформы если переданы
        if platforms is not None:
            GamePlatform.objects.filter(game=instance).delete()
            for platform in platforms:
                GamePlatform.objects.get_or_create(game=instance, platform=platform)

        return instance

    def to_representation(self, instance):
        """Возвращает детальное представление после создания/обновления."""
        return GameDetailSerializer(instance, context=self.context).data
