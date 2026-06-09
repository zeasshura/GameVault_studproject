"""
Разрешения (permissions) для приложения games.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    Разрешение:
    - Чтение (GET, HEAD, OPTIONS) — для всех пользователей (в том числе анонимных)
    - Запись (POST, PUT, PATCH, DELETE) — только для пользователей с ролью 'admin'
    """

    def has_permission(self, request, view):
        # Разрешены безопасные методы: GET, HEAD, OPTIONS
        if request.method in SAFE_METHODS:
            return True

        # Для остальных методов — нужна аутентификация и роль admin
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )
