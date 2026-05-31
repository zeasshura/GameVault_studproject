"""
Модели для приложения reviews.
"""

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Review(models.Model):
    """Отзыв пользователя на игру."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Пользователь'
    )
    game = models.ForeignKey(
        'games.Game',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Игра'
    )
    text = models.TextField(
        verbose_name='Текст отзыва'
    )
    score = models.IntegerField(
        validators=[
            MinValueValidator(1, message='Оценка не может быть меньше 1.'),
            MaxValueValidator(10, message='Оценка не может быть больше 10.'),
        ],
        verbose_name='Оценка (1-10)'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        unique_together = ('user', 'game')  # один отзыв на игру от пользователя
        ordering = ['-created_at']

    def __str__(self):
        return f'Отзыв {self.user.username} на {self.game.title} ({self.score}/10)'

    def save(self, *args, **kwargs):
        """При сохранении пересчитывает средний рейтинг игры."""
        super().save(*args, **kwargs)
        self.game.update_avg_rating()

    def delete(self, *args, **kwargs):
        """При удалении пересчитывает средний рейтинг игры."""
        game = self.game
        super().delete(*args, **kwargs)
        game.update_avg_rating()
