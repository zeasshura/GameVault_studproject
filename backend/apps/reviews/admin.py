"""
Django admin для приложения reviews.
"""

from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'game', 'score', 'created_at')
    list_filter = ('score',)
    search_fields = ('user__username', 'game__title', 'text')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
