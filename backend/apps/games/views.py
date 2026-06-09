"""
Представления (views) для приложения games.
"""

import logging

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Game, Genre, Platform
from .permissions import IsAdminOrReadOnly
from .serializers import (
    GameListSerializer,
    GameDetailSerializer,
    GameWriteSerializer,
    GenreSerializer,
    PlatformSerializer,
)
from .services import RawgService, FileParserService

logger = logging.getLogger(__name__)


class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    @extend_schema(
        summary='Список жанров',
        description='Возвращает список всех жанров.'
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class PlatformViewSet(viewsets.ModelViewSet):
    queryset = Platform.objects.all()
    serializer_class = PlatformSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    @extend_schema(
        summary='Список платформ',
        description='Возвращает список всех платформ.'
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all().prefetch_related('genres', 'platforms')
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GameDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return GameWriteSerializer
        return GameListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        genre_id = params.get('genre_id') or params.get('genre')
        if genre_id:
            if isinstance(genre_id, str):
                genre_ids = [x.strip() for x in genre_id.split(',') if x.strip().isdigit()]
                if genre_ids:
                    qs = qs.filter(genres__id__in=genre_ids)
            else:
                qs = qs.filter(genres__id=genre_id)

        platform_id = params.get('platform_id') or params.get('platform')
        if platform_id:
            if isinstance(platform_id, str):
                platform_ids = [x.strip() for x in platform_id.split(',') if x.strip().isdigit()]
                if platform_ids:
                    qs = qs.filter(platforms__id__in=platform_ids)
            else:
                qs = qs.filter(platforms__id=platform_id)

        year = params.get('year')
        if year:
            qs = qs.filter(release_date__year=year)

        year_from = params.get('year_from')
        if year_from:
            qs = qs.filter(release_date__year__gte=year_from)

        year_to = params.get('year_to')
        if year_to:
            qs = qs.filter(release_date__year__lte=year_to)

        min_rating = params.get('min_rating')
        if min_rating:
            try:
                qs = qs.filter(avg_rating__gte=float(min_rating))
            except (ValueError, TypeError):
                pass

        search = params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)

        return qs.distinct()

    def retrieve(self, request, *args, **kwargs):
        """
        Получение детальной информации об игре.
        Если описание содержит заглушку, запускаем фоновое обновление из RAWG.
        """
        instance = self.get_object()

        placeholder = 'Описание загружается из RAWG'
        if (not instance.description or placeholder in instance.description) and instance.rawg_id:
            RawgService.fetch_description_sync(instance.id, instance.rawg_id)
            instance.refresh_from_db()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @extend_schema(
        parameters=[
            OpenApiParameter('genre_id', OpenApiTypes.INT, description='Фильтр по ID жанра'),
            OpenApiParameter('platform_id', OpenApiTypes.INT, description='Фильтр по ID платформы'),
            OpenApiParameter('year', OpenApiTypes.INT, description='Фильтр по году выхода'),
            OpenApiParameter('min_rating', OpenApiTypes.FLOAT, description='Минимальный рейтинг'),
            OpenApiParameter('search', OpenApiTypes.STR, description='Поиск по названию'),
        ],
        summary='Список игр',
        description='Возвращает список игр с возможностью фильтрации.'
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        parameters=[
            OpenApiParameter('q', OpenApiTypes.STR, description='Поисковый запрос', required=True),
        ],
        summary='Поиск игр в RAWG',
        description='Выполняет поиск игр через RAWG.io API и возвращает результаты.'
    )
    @action(detail=False, methods=['get'], url_path='search-rawg', permission_classes=[IsAdminOrReadOnly])
    def search_rawg(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response(
                {'error': 'Параметр "q" обязателен.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            results = RawgService.search_games(query)
            return Response(results)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f'Ошибка при запросе RAWG API: {e}')
            return Response(
                {'error': 'Ошибка при запросе RAWG API или таймаут'},
                status=status.HTTP_502_BAD_GATEWAY
            )

    @extend_schema(
        request={'application/json': {'type': 'object', 'properties': {'rawg_id': {'type': 'integer'}}}},
        summary='Импорт игры из RAWG',
        description='Загружает игру из RAWG.io API по ID и сохраняет в базу данных.'
    )
    @action(detail=False, methods=['post'], url_path='import-rawg', permission_classes=[IsAdminOrReadOnly])
    def import_rawg(self, request):
        rawg_id = request.data.get('rawg_id')
        if not rawg_id:
            return Response(
                {'error': 'Поле "rawg_id" обязательно.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Game.objects.filter(rawg_id=rawg_id).exists():
            game = Game.objects.get(rawg_id=rawg_id)
            return Response(
                {
                    'message': 'Игра уже импортирована.',
                    'game': GameDetailSerializer(game, context={'request': request}).data,
                },
                status=status.HTTP_200_OK
            )

        try:
            game, created = RawgService.import_game(rawg_id)
            return Response(
                {
                    'message': 'Игра успешно импортирована.' if created else 'Данные игры обновлены.',
                    'game': GameDetailSerializer(game, context={'request': request}).data,
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f'Ошибка при импорте из RAWG API: {e}')
            return Response(
                {'error': 'Ошибка при импорте из RAWG API или таймаут'},
                status=status.HTTP_502_BAD_GATEWAY
            )

    @extend_schema(
        request={'multipart/form-data': {'type': 'object', 'properties': {
            'file': {'type': 'string', 'format': 'binary'}
        }}},
        summary='Загрузка игр из CSV/XML',
        description='Парсит CSV или XML файл и массово импортирует игры в базу данных.'
    )
    @action(
        detail=False,
        methods=['post'],
        url_path='upload-csv',
        permission_classes=[IsAdminOrReadOnly],
        parser_classes=[MultiPartParser, FormParser]
    )
    def upload_csv(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'Файл не передан. Используйте поле "file".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        filename = file.name.lower()
        if filename.endswith('.csv'):
            imported, errors = FileParserService.process_csv(file)
        elif filename.endswith('.xml'):
            imported, errors = FileParserService.process_xml(file)
        else:
            return Response(
                {'error': 'Поддерживаются только CSV и XML файлы.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'imported': imported, 'errors': errors},
            status=status.HTTP_200_OK
        )
