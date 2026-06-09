import csv
import io
import logging
import threading
from datetime import datetime

import requests
import defusedxml.ElementTree as ET
from django.conf import settings
from django.db import transaction
from django.utils.html import strip_tags

from .models import Game, Genre, Platform, GameGenre, GamePlatform

logger = logging.getLogger(__name__)

class RawgService:
    @staticmethod
    def search_games(query: str) -> dict:
        api_key = getattr(settings, 'RAWG_API_KEY', '')
        if not api_key:
            raise ValueError('RAWG_API_KEY не настроен на сервере.')

        response = requests.get(
            f'{settings.RAWG_BASE_URL}/games',
            params={'key': api_key, 'search': query, 'page_size': 20, 'lang': 'ru'},
            headers={'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
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

        return {
            'count': data.get('count', 0),
            'results': results,
        }

    @staticmethod
    def import_game(rawg_id: int) -> tuple[Game, bool]:
        api_key = getattr(settings, 'RAWG_API_KEY', '')
        if not api_key:
            raise ValueError('RAWG_API_KEY не настроен на сервере.')

        response = requests.get(
            f'{settings.RAWG_BASE_URL}/games/{rawg_id}',
            params={'key': api_key, 'lang': 'ru'},
            headers={'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        with transaction.atomic():
            bg_image = data.get('background_image')
            if bg_image and 'media.rawg.io/media/' in bg_image:
                bg_image = bg_image.replace('media.rawg.io/media/', 'media.rawg.io/media/crop/600/400/')

            raw_desc = data.get('description_raw') or ''
            html_desc = data.get('description') or ''
            desc = raw_desc.strip() if raw_desc else strip_tags(html_desc).strip()

            video_url = None
            try:
                movies_res = requests.get(
                    f'{settings.RAWG_BASE_URL}/games/{rawg_id}/movies',
                    params={'key': api_key},
                    timeout=5
                )
                if movies_res.status_code == 200:
                    movies_data = movies_res.json()
                    if movies_data.get('results'):
                        video_url = movies_data['results'][0]['data'].get('480') or movies_data['results'][0]['data'].get('max')
            except Exception:
                pass

            game, created = Game.objects.update_or_create(
                rawg_id=data['id'],
                defaults={
                    'title': data.get('name', ''),
                    'description': desc,
                    'release_date': data.get('released') or None,
                    'cover_url': bg_image or None,
                    'video_url': video_url,
                    'avg_rating': round(data.get('rating', 0.0) * 2, 2),
                    'initial_rating': round(data.get('rating', 0.0) * 2, 2),
                    'initial_rating_count': data.get('ratings_count', 0),
                }
            )

            for genre_data in data.get('genres', []):
                genre, _ = Genre.objects.get_or_create(name=genre_data['name'])
                GameGenre.objects.get_or_create(game=game, genre=genre)

            for platform_data in data.get('platforms', []):
                platform_name = platform_data['platform']['name']
                platform, _ = Platform.objects.get_or_create(name=platform_name)
                GamePlatform.objects.get_or_create(game=game, platform=platform)

        return game, created

    @staticmethod
    def fetch_description_async(game_id: int, rawg_id: int):
        api_key = getattr(settings, 'RAWG_API_KEY', '')
        if not api_key:
            return

        def _fetch():
            try:
                resp = requests.get(
                    f'{settings.RAWG_BASE_URL}/games/{rawg_id}',
                    params={'key': api_key, 'lang': 'ru'},
                    timeout=5,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    raw_desc = data.get('description_raw') or ''
                    html_desc = data.get('description') or ''
                    desc = raw_desc.strip() if raw_desc else strip_tags(html_desc).strip()
                    if desc:
                        Game.objects.filter(pk=game_id).update(description=desc)
                        logger.info(f'Описание для игры {game_id} успешно обновлено из RAWG.')
            except requests.Timeout:
                logger.warning(f'RAWG API не ответил вовремя для игры {game_id} (rawg_id={rawg_id}).')
            except Exception as e:
                logger.error(f'Ошибка при получении описания из RAWG для игры {game_id}: {e}')

        thread = threading.Thread(target=_fetch, daemon=True)
        thread.start()


class FileParserService:
    @staticmethod
    def process_csv(file) -> tuple[int, list[str]]:
        imported = 0
        errors = []
        try:
            content = file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            for row_num, row in enumerate(reader, start=2):
                try:
                    game = FileParserService._create_game_from_dict(row, row_num)
                    if game:
                        imported += 1
                except Exception as e:
                    errors.append(f'Строка {row_num}: {str(e)}')
        except Exception as e:
            errors.append(f'Ошибка чтения CSV: {str(e)}')
        return imported, errors

    @staticmethod
    def process_xml(file) -> tuple[int, list[str]]:
        imported = 0
        errors = []
        try:
            content = file.read()
            root = ET.fromstring(content)
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
                    game = FileParserService._create_game_from_dict(data, idx)
                    if game:
                        imported += 1
                except Exception as e:
                    errors.append(f'Элемент {idx}: {str(e)}')
        except ET.ParseError as e:
            errors.append(f'Ошибка парсинга XML: {str(e)}')
        except Exception as e:
            errors.append(f'Ошибка чтения XML: {str(e)}')
        return imported, errors

    @staticmethod
    def _create_game_from_dict(data: dict, row_num: int):
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

            genres_str = (data.get('genres') or '').strip()
            if genres_str:
                for genre_name in genres_str.split(','):
                    genre_name = genre_name.strip()
                    if genre_name:
                        genre, _ = Genre.objects.get_or_create(name=genre_name)
                        GameGenre.objects.get_or_create(game=game, genre=genre)

            platforms_str = (data.get('platforms') or '').strip()
            if platforms_str:
                for platform_name in platforms_str.split(','):
                    platform_name = platform_name.strip()
                    if platform_name:
                        platform, _ = Platform.objects.get_or_create(name=platform_name)
                        GamePlatform.objects.get_or_create(game=game, platform=platform)

        return game
