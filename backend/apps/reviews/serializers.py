"""
Сериализаторы для приложения reviews.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Review

User = get_user_model()


class ReviewUserSerializer(serializers.ModelSerializer):
    """Краткий сериализатор пользователя для отображения в отзыве."""

    class Meta:
        model = User
        fields = ('id', 'username', 'avatar_url')


class ReviewSerializer(serializers.ModelSerializer):
    """
    Полный сериализатор отзыва.
    Используется для чтения (поле user — только чтение).
    """

    user = ReviewUserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'game', 'text', 'score', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class ReviewWriteSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания/обновления отзыва.
    Пользователь и игра устанавливаются из контекста/URL, не из тела запроса.
    """

    class Meta:
        model = Review
        fields = ('id', 'text', 'score')

    def validate_score(self, value):
        """Дополнительная валидация оценки."""
        if not (1 <= value <= 10):
            raise serializers.ValidationError('Оценка должна быть от 1 до 10.')
        return value

    def create(self, validated_data):
        """Создаёт отзыв с пользователем и игрой из контекста."""
        user = self.context['request'].user
        game = self.context['game']

        if Review.objects.filter(user=user, game=game).exists():
            raise serializers.ValidationError(
                'Вы уже оставили отзыв на эту игру.'
            )

        return Review.objects.create(user=user, game=game, **validated_data)

    def to_representation(self, instance):
        """Возвращает полное представление после создания/обновления."""
        return ReviewSerializer(instance, context=self.context).data
