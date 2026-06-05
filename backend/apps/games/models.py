"""
Модели для приложения games.
"""

from django.db import models


class Genre(models.Model):
    """Жанр игры."""

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Название'
    )

    class Meta:
        verbose_name = 'Жанр'
        verbose_name_plural = 'Жанры'
        ordering = ['name']

    def __str__(self):
        return self.name


class Platform(models.Model):
    """Платформа для игры."""

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Название'
    )

    class Meta:
        verbose_name = 'Платформа'
        verbose_name_plural = 'Платформы'
        ordering = ['name']

    def __str__(self):
        return self.name


class Game(models.Model):
    """Основная модель игры."""

    title = models.CharField(
        max_length=255,
        verbose_name='Название'
    )
    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Описание'
    )
    release_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Дата выхода'
    )
    cover_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL обложки'
    )
    video_url = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL видео (трейлера)'
    )
    avg_rating = models.FloatField(
        default=0.0,
        verbose_name='Средний рейтинг'
    )
    initial_rating = models.FloatField(
        default=0.0,
        verbose_name='Изначальный рейтинг'
    )
    initial_rating_count = models.IntegerField(
        default=0,
        verbose_name='Количество оценок (RAWG)'
    )
    rawg_id = models.IntegerField(
        null=True,
        blank=True,
        unique=True,
        verbose_name='RAWG ID'
    )
    genres = models.ManyToManyField(
        Genre,
        through='GameGenre',
        blank=True,
        related_name='games',
        verbose_name='Жанры'
    )
    platforms = models.ManyToManyField(
        Platform,
        through='GamePlatform',
        blank=True,
        related_name='games',
        verbose_name='Платформы'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )

    class Meta:
        verbose_name = 'Игра'
        verbose_name_plural = 'Игры'
        ordering = ['-created_at', 'id']

    def __str__(self):
        return self.title

    def update_avg_rating(self):
        """Пересчитывает средний рейтинг на основе всех отзывов и изначальной оценки с учетом веса."""
        from apps.reviews.models import Review
        reviews = Review.objects.filter(game=self)
        local_count = reviews.count()
        if local_count > 0:
            local_total = sum(r.score for r in reviews)
            if self.initial_rating_count > 0:
                total_score = local_total + (self.initial_rating * self.initial_rating_count)
                total_count = local_count + self.initial_rating_count
                self.avg_rating = round(total_score / total_count, 2)
            else:
                self.avg_rating = round(local_total / local_count, 2)
        else:
            self.avg_rating = self.initial_rating
        self.save(update_fields=['avg_rating'])


class GameGenre(models.Model):
    """Промежуточная модель связи игры и жанра."""

    game = models.ForeignKey(
        Game,
        on_delete=models.CASCADE,
        verbose_name='Игра'
    )
    genre = models.ForeignKey(
        Genre,
        on_delete=models.CASCADE,
        verbose_name='Жанр'
    )

    class Meta:
        verbose_name = 'Жанр игры'
        verbose_name_plural = 'Жанры игр'
        unique_together = ('game', 'genre')

    def __str__(self):
        return f'{self.game} — {self.genre}'


class GamePlatform(models.Model):
    """Промежуточная модель связи игры и платформы."""

    game = models.ForeignKey(
        Game,
        on_delete=models.CASCADE,
        verbose_name='Игра'
    )
    platform = models.ForeignKey(
        Platform,
        on_delete=models.CASCADE,
        verbose_name='Платформа'
    )

    class Meta:
        verbose_name = 'Платформа игры'
        verbose_name_plural = 'Платформы игр'
        unique_together = ('game', 'platform')

    def __str__(self):
        return f'{self.game} — {self.platform}'
