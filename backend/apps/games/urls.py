"""
URL маршруты для приложения games.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import GameViewSet, GenreViewSet, PlatformViewSet

router = DefaultRouter()
router.register(r'genres', GenreViewSet, basename='genre')
router.register(r'platforms', PlatformViewSet, basename='platform')
router.register(r'', GameViewSet, basename='game')

urlpatterns = [
    path('', include(router.urls)),
]
