"""
Django admin для приложения collections.
"""

from django.contrib import admin
from .models import Collection, CollectionGame


class CollectionGameInline(admin.TabularInline):
    model = CollectionGame
    extra = 1
    raw_id_fields = ('game',)


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user', 'created_at')
    list_filter = ('user',)
    search_fields = ('name', 'user__username')
    ordering = ('-created_at',)
    inlines = [CollectionGameInline]
    readonly_fields = ('created_at',)


@admin.register(CollectionGame)
class CollectionGameAdmin(admin.ModelAdmin):
    list_display = ('id', 'collection', 'game')
    search_fields = ('collection__name', 'game__title')
