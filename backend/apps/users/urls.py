"""
URL маршруты для приложения users.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, LoginView, MeView, UserProfileView

urlpatterns = [
    # Регистрация нового пользователя
    path('register/', RegisterView.as_view(), name='auth-register'),

    # Вход в систему
    path('login/', LoginView.as_view(), name='auth-login'),

    # Обновление access токена
    path('refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Данные текущего пользователя
    path('me/', MeView.as_view(), name='auth-me'),

    # Публичный профиль другого пользователя
    path('users/<int:pk>/', UserProfileView.as_view(), name='user-profile'),
]
