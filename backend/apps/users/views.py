"""
Представления (views) для приложения users.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    LoginSerializer,
    TokenResponseSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    """
    Регистрация нового пользователя.
    POST /api/auth/register/
    """

    permission_classes = [AllowAny]

    @extend_schema(
        request=RegisterSerializer,
        responses={201: TokenResponseSerializer},
        summary='Регистрация пользователя',
        description='Создаёт нового пользователя и возвращает JWT токены.'
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Генерация JWT токенов
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return Response(
            {
                'access': str(access),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """
    Вход в систему.
    POST /api/auth/login/
    """

    permission_classes = [AllowAny]

    @extend_schema(
        request=LoginSerializer,
        responses={200: TokenResponseSerializer},
        summary='Вход в систему',
        description='Аутентификация по email и паролю. Возвращает JWT токены.'
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Генерация JWT токенов
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return Response(
            {
                'access': str(access),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK
        )


class MeView(APIView):
    """
    Получение данных текущего пользователя.
    GET /api/auth/me/
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: UserSerializer},
        summary='Данные текущего пользователя',
        description='Возвращает профиль аутентифицированного пользователя.'
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=UserSerializer,
        responses={200: UserSerializer},
        summary='Обновление профиля',
        description='Обновляет данные текущего пользователя (частичное обновление).'
    )
    def patch(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """
    Получение публичного профиля пользователя по ID.
    GET /api/auth/users/<int:pk>/
    """
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: UserSerializer},
        summary='Публичный профиль пользователя',
        description='Возвращает публичные данные пользователя (без email), его коллекции и отзывы.'
    )
    def get(self, request, pk):
        from django.shortcuts import get_object_or_404
        user = get_object_or_404(User, pk=pk)
        
        user_data = UserSerializer(user).data
        # Скрываем email в целях приватности, если профиль запрашивает другой пользователь
        if not request.user.is_authenticated or request.user != user:
            user_data.pop('email', None)
            
        # Загружаем коллекции пользователя
        from apps.collections.models import Collection
        from apps.collections.serializers import CollectionSerializer
        collections = Collection.objects.filter(user=user).prefetch_related('collection_games__game')
        collections_data = CollectionSerializer(collections, many=True, context={'request': request}).data
        
        # Загружаем отзывы пользователя
        from apps.reviews.models import Review
        from apps.reviews.serializers import ReviewSerializer
        reviews = Review.objects.filter(user=user).select_related('game')
        reviews_data = ReviewSerializer(reviews, many=True, context={'request': request}).data
        
        return Response({
            'user': user_data,
            'collections': collections_data,
            'reviews': reviews_data
        }, status=status.HTTP_200_OK)

