"""
URL configuration for GameVault project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # Аутентификация и пользователи
    path('api/auth/', include('apps.users.urls')),

    # Игры, жанры, платформы
    path('api/games/', include('apps.games.urls')),

    # Отзывы
    path('api/reviews/', include('apps.reviews.urls')),

    # Коллекции
    path('api/collections/', include('apps.collections.urls')),

    # OpenAPI схема
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # Swagger UI документация
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # ReDoc документация (альтернативная)
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Обслуживание медиафайлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
