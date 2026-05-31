"""
Django admin для приложения games.
"""

from django.contrib import admin
from .models import Game, Genre, Platform, GameGenre, GamePlatform


class GameGenreInline(admin.TabularInline):
    model = GameGenre
    extra = 1


class GamePlatformInline(admin.TabularInline):
    model = GamePlatform
    extra = 1


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('title', 'avg_rating', 'release_date', 'rawg_id', 'created_at')
    list_filter = ('genres', 'platforms')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)
    inlines = [GameGenreInline, GamePlatformInline]
    readonly_fields = ('avg_rating', 'created_at')


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Platform)
class PlatformAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
