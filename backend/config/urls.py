from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Админка Django
    path('admin/', admin.site.urls),

    # Аутентификация и пользователи
    path('api/auth/', include('apps.users.urls')),

    # Игры, жанры, платформы
    path('api/games/', include('apps.games.urls')),

    # Отзывы
    path('api/reviews/', include('apps.reviews.urls')),

    # Коллекции
    path('api/collections/', include('apps.collections.urls')),

    # Схема OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # Документация Swagger UI
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Документация ReDoc (альтернативная)
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Обслуживание медиафайлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
