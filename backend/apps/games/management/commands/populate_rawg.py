import logging
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from apps.games.models import Game, Genre, Platform, GameGenre, GamePlatform

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fetches popular games from RAWG API and populates the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--pages',
            type=int,
            default=2,
            help='Number of pages to fetch (20 games per page)',
        )

    def handle(self, *args, **options):
        pages = options['pages']
        api_key = getattr(settings, 'RAWG_API_KEY', '')
        
        if not api_key:
            self.stdout.write(self.style.ERROR('RAWG_API_KEY is not set in settings/env!'))
            return

        self.stdout.write(self.style.SUCCESS(f'Fetching {pages} pages of popular games from RAWG...'))
        
        imported_count = 0
        
        for page in range(1, pages + 1):
            self.stdout.write(f'Fetching page {page}...')
            try:
                # Fetch games sorted by rating
                response = requests.get(
                    f'{settings.RAWG_BASE_URL}/games',
                    params={
                        'key': api_key,
                        'page': page,
                        'page_size': 20,
                        'ordering': '-rating',
                    },
                    timeout=10
                )
                response.raise_for_status()
                data = response.json()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error fetching page {page}: {e}'))
                break
                
            results = data.get('results', [])
            if not results:
                break
                
            for game_data in results:
                rawg_id = game_data.get('id')
                if not rawg_id:
                    continue
                    
                # Skip if already exists
                if Game.objects.filter(rawg_id=rawg_id).exists():
                    continue
                    
                try:
                    with transaction.atomic():
                        game = Game.objects.create(
                            rawg_id=rawg_id,
                            title=game_data.get('name', ''),
                            description='(Описание загружается из RAWG при детальном просмотре)', # List endpoint doesn't return full description
                            release_date=game_data.get('released') or None,
                            cover_url=game_data.get('background_image') or None,
                            avg_rating=round(game_data.get('rating', 0.0) * 2, 2),
                            initial_rating=round(game_data.get('rating', 0.0) * 2, 2),
                        )
                        
                        for genre_data in game_data.get('genres', []):
                            genre, _ = Genre.objects.get_or_create(name=genre_data['name'])
                            GameGenre.objects.get_or_create(game=game, genre=genre)
                            
                        for platform_data in game_data.get('platforms', []):
                            platform_name = platform_data['platform']['name']
                            platform, _ = Platform.objects.get_or_create(name=platform_name)
                            GamePlatform.objects.get_or_create(game=game, platform=platform)
                            
                        imported_count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error importing game {game_data.get("name")}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {imported_count} games!'))
