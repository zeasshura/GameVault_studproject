"""
Модели для приложения collections.
"""

from django.conf import settings
from django.db import models


class Collection(models.Model):
    """Коллекция игр пользователя."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='collections',
        verbose_name='Пользователь'
    )
    name = models.CharField(
        max_length=255,
        verbose_name='Название коллекции'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )

    class Meta:
        verbose_name = 'Коллекция'
        verbose_name_plural = 'Коллекции'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.user.username})'


class CollectionGame(models.Model):
    """Промежуточная модель — игра в коллекции."""

    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name='collection_games',
        verbose_name='Коллекция'
    )
    game = models.ForeignKey(
        'games.Game',
        on_delete=models.CASCADE,
        related_name='in_collections',
        verbose_name='Игра'
    )

    class Meta:
        verbose_name = 'Игра в коллекции'
        verbose_name_plural = 'Игры в коллекциях'
        unique_together = ('collection', 'game')

    def __str__(self):
        return f'{self.game.title} в "{self.collection.name}"'
