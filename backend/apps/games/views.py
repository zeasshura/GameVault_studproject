"""
Представления (views) для приложения games.
Включает RAWG API интеграцию и загрузку CSV/XML файлов.
"""

import csv
import io
import logging
from datetime import datetime

import requests
import defusedxml.ElementTree as ET
from django.conf import settings
from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Game, Genre, Platform, GameGenre, GamePlatform
from .permissions import IsAdminOrReadOnly
from .serializers import (
    GameListSerializer,
    GameDetailSerializer,
    GameWriteSerializer,
    GenreSerializer,
    PlatformSerializer,
)

logger = logging.getLogger(__name__)


class GenreViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления жанрами.
    Чтение — для всех, запись — только для администраторов.
    """

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
    """
    ViewSet для управления платформами.
    Чтение — для всех, запись — только для администраторов.
    """

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
    """
    ViewSet для управления играми.

    Поддерживает:
    - CRUD операции
    - Фильтрацию по жанру, платформе, году выхода, минимальному рейтингу
    - Текстовый поиск по названию
    - Интеграция с RAWG API
    - Загрузка игр из CSV/XML файлов
    """

    queryset = Game.objects.all().prefetch_related('genres', 'platforms')
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия."""
        if self.action == 'retrieve':
            return GameDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return GameWriteSerializer
        return GameListSerializer

    def get_queryset(self):
        """Фильтрация игр по параметрам запроса."""
        qs = super().get_queryset()
        params = self.request.query_params

        # Фильтр по жанру
        genre_id = params.get('genre_id') or params.get('genre')
        if genre_id:
            if isinstance(genre_id, str):
                genre_ids = [x.strip() for x in genre_id.split(',') if x.strip().isdigit()]
                if genre_ids:
                    qs = qs.filter(genres__id__in=genre_ids)
            else:
                qs = qs.filter(genres__id=genre_id)

        # Фильтр по платформе
        platform_id = params.get('platform_id') or params.get('platform')
        if platform_id:
            if isinstance(platform_id, str):
                platform_ids = [x.strip() for x in platform_id.split(',') if x.strip().isdigit()]
                if platform_ids:
                    qs = qs.filter(platforms__id__in=platform_ids)
            else:
                qs = qs.filter(platforms__id=platform_id)

        # Фильтр по году выхода
        year = params.get('year')
        if year:
            qs = qs.filter(release_date__year=year)

        year_from = params.get('year_from')
        if year_from:
            qs = qs.filter(release_date__year__gte=year_from)

        year_to = params.get('year_to')
        if year_to:
            qs = qs.filter(release_date__year__lte=year_to)

        # Фильтр по минимальному рейтингу
        min_rating = params.get('min_rating')
        if min_rating:
            try:
                qs = qs.filter(avg_rating__gte=float(min_rating))
            except (ValueError, TypeError):
                pass

        # Поиск по названию
        search = params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)

        return qs.distinct()

    def retrieve(self, request, *args, **kwargs):
        """
        Получение детальной информации об игре.
        Если описание содержит заглушку, подтягиваем его из RAWG.
        """
        instance = self.get_object()
        
        # Если описание пустое или содержит заглушку о загрузке, и есть rawg_id
        placeholder = 'Описание загружается из RAWG'
        if (not instance.description or placeholder in instance.description) and instance.rawg_id:
            api_key = getattr(settings, 'RAWG_API_KEY', '')
            if api_key:
                try:
                    response = requests.get(
                        f'{settings.RAWG_BASE_URL}/games/{instance.rawg_id}',
                        params={'key': api_key},
                        timeout=10
                    )
                    if response.status_code == 200:
                        data = response.json()
                        desc = data.get('description_raw', '') or data.get('description', '')
                        if desc:
                            instance.description = desc
                            instance.save(update_fields=['description'])
                except Exception as e:
                    logger.error(f'Ошибка при ленивом получении описания из RAWG для игры {instance.id}: {e}')
        
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
        """
        GET /api/games/search-rawg/?q=query
        Поиск игр во внешнем RAWG API.
        """
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response(
                {'error': 'Параметр "q" обязателен.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        api_key = getattr(settings, 'RAWG_API_KEY', '')
        if not api_key:
            return Response(
                {'error': 'RAWG_API_KEY не настроен на сервере.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            response = requests.get(
                f'{settings.RAWG_BASE_URL}/games',
                params={'key': api_key, 'search': query, 'page_size': 20},
                headers={'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
        except requests.Timeout:
            return Response(
                {'error': 'RAWG API не ответил вовремя.'},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.RequestException as e:
            logger.error(f'Ошибка при запросе RAWG API: {e}')
            return Response(
                {'error': f'Ошибка при запросе RAWG API: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # Форматируем результаты
        results = []
        for game in data.get('results', []):
            bg_image = game.get('background_image')
            if bg_image and 'media.rawg.io/media/' in bg_image:
                bg_image = bg_image.replace('media.rawg.io/media/', 'media.rawg.io/media/crop/600/400/')
                
            results.append({
                'rawg_id': game.get('id'),
                'title': game.get('name'),
                'release_date': game.get('released'),
                'cover_url': bg_image,
                'avg_rating': round(game.get('rating', 0.0) * 2, 2),
                'genres': [g['name'] for g in game.get('genres', [])],
                'platforms': [p['platform']['name'] for p in game.get('platforms', [])],
            })

        return Response({
            'count': data.get('count', 0),
            'results': results,
        })

    @extend_schema(
        request={'application/json': {'type': 'object', 'properties': {'rawg_id': {'type': 'integer'}}}},
        summary='Импорт игры из RAWG',
        description='Загружает игру из RAWG.io API по ID и сохраняет в базу данных.'
    )
    @action(detail=False, methods=['post'], url_path='import-rawg', permission_classes=[IsAdminOrReadOnly])
    def import_rawg(self, request):
        """
        POST /api/games/import-rawg/
        Body: {"rawg_id": 12345}
        Импортирует игру из RAWG API по ID.
        """
        rawg_id = request.data.get('rawg_id')
        if not rawg_id:
            return Response(
                {'error': 'Поле "rawg_id" обязательно.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        api_key = getattr(settings, 'RAWG_API_KEY', '')
        if not api_key:
            return Response(
                {'error': 'RAWG_API_KEY не настроен на сервере.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Проверяем, не импортировали ли уже эту игру
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
            response = requests.get(
                f'{settings.RAWG_BASE_URL}/games/{rawg_id}',
                params={'key': api_key},
                headers={'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
        except requests.Timeout:
            return Response(
                {'error': 'RAWG API не ответил вовремя.'},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.RequestException as e:
            logger.error(f'Ошибка при импорте из RAWG API: {e}')
            return Response(
                {'error': f'Ошибка при запросе RAWG API: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        with transaction.atomic():
            bg_image = data.get('background_image')
            if bg_image and 'media.rawg.io/media/' in bg_image:
                bg_image = bg_image.replace('media.rawg.io/media/', 'media.rawg.io/media/crop/600/400/')

            # Создание или обновление игры
            game, created = Game.objects.update_or_create(
                rawg_id=data['id'],
                defaults={
                    'title': data.get('name', ''),
                    'description': data.get('description_raw', '') or data.get('description', ''),
                    'release_date': data.get('released') or None,
                    'cover_url': bg_image or None,
                    'avg_rating': round(data.get('rating', 0.0) * 2, 2),
                    'initial_rating': round(data.get('rating', 0.0) * 2, 2),
                    'initial_rating_count': data.get('ratings_count', 0),
                }
            )

            # Привязка жанров
            for genre_data in data.get('genres', []):
                genre, _ = Genre.objects.get_or_create(name=genre_data['name'])
                GameGenre.objects.get_or_create(game=game, genre=genre)

            # Привязка платформ
            for platform_data in data.get('platforms', []):
                platform_name = platform_data['platform']['name']
                platform, _ = Platform.objects.get_or_create(name=platform_name)
                GamePlatform.objects.get_or_create(game=game, platform=platform)

        return Response(
            {
                'message': 'Игра успешно импортирована.' if created else 'Данные игры обновлены.',
                'game': GameDetailSerializer(game, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
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
        """
        POST /api/games/upload-csv/
        Загрузка и парсинг CSV или XML файла с играми.
        """
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'Файл не передан. Используйте поле "file".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        filename = file.name.lower()
        imported = 0
        errors = []

        if filename.endswith('.csv'):
            imported, errors = self._process_csv(file)
        elif filename.endswith('.xml'):
            imported, errors = self._process_xml(file)
        else:
            return Response(
                {'error': 'Поддерживаются только CSV и XML файлы.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'imported': imported, 'errors': errors},
            status=status.HTTP_200_OK
        )

    def _process_csv(self, file):
        """Обрабатывает CSV файл с играми."""
        imported = 0
        errors = []

        try:
            content = file.read().decode('utf-8-sig')  # utf-8-sig для Windows BOM
            reader = csv.DictReader(io.StringIO(content))

            for row_num, row in enumerate(reader, start=2):
                try:
                    game = self._create_game_from_dict(row, row_num)
                    if game:
                        imported += 1
                except Exception as e:
                    errors.append(f'Строка {row_num}: {str(e)}')

        except Exception as e:
            errors.append(f'Ошибка чтения CSV: {str(e)}')

        return imported, errors

    def _process_xml(self, file):
        """Обрабатывает XML файл с играми."""
        imported = 0
        errors = []

        try:
            content = file.read()
            root = ET.fromstring(content)  # defusedxml защищён от XXE атак

            for idx, game_elem in enumerate(root.findall('game'), start=1):
                try:
                    data = {
                        'title': (game_elem.findtext('title') or '').strip(),
                        'description': (game_elem.findtext('description') or '').strip(),
                        'release_date': (game_elem.findtext('release_date') or '').strip(),
                        'genres': (game_elem.findtext('genres') or '').strip(),
                        'platforms': (game_elem.findtext('platforms') or '').strip(),
                        'cover_url': (game_elem.findtext('cover_url') or '').strip(),
                    }
                    game = self._create_game_from_dict(data, idx)
                    if game:
                        imported += 1
                except Exception as e:
                    errors.append(f'Элемент {idx}: {str(e)}')

        except ET.ParseError as e:
            errors.append(f'Ошибка парсинга XML: {str(e)}')
        except Exception as e:
            errors.append(f'Ошибка чтения XML: {str(e)}')

        return imported, errors

    def _create_game_from_dict(self, data: dict, row_num: int):
        """Создаёт игру из словаря данных (из CSV/XML строки)."""
        title = (data.get('title') or '').strip()
        if not title:
            raise ValueError('Поле "title" обязательно.')

        release_date = None
        raw_date = (data.get('release_date') or '').strip()
        if raw_date:
            for fmt in ('%Y-%m-%d', '%d.%m.%Y', '%Y/%m/%d'):
                try:
                    release_date = datetime.strptime(raw_date, fmt).date()
                    break
                except ValueError:
                    continue

        with transaction.atomic():
            game, _ = Game.objects.get_or_create(
                title=title,
                defaults={
                    'description': (data.get('description') or '').strip(),
                    'release_date': release_date,
                    'cover_url': (data.get('cover_url') or '').strip() or None,
                }
            )

            # Жанры: через запятую
            genres_str = (data.get('genres') or '').strip()
            if genres_str:
                for genre_name in genres_str.split(','):
                    genre_name = genre_name.strip()
                    if genre_name:
                        genre, _ = Genre.objects.get_or_create(name=genre_name)
                        GameGenre.objects.get_or_create(game=game, genre=genre)

            # Платформы: через запятую
            platforms_str = (data.get('platforms') or '').strip()
            if platforms_str:
                for platform_name in platforms_str.split(','):
                    platform_name = platform_name.strip()
                    if platform_name:
                        platform, _ = Platform.objects.get_or_create(name=platform_name)
                        GamePlatform.objects.get_or_create(game=game, platform=platform)

        return game
