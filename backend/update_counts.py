import os
import django
import requests
from time import sleep

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.games.models import Game
from django.conf import settings

api_key = settings.RAWG_API_KEY
games = Game.objects.filter(rawg_id__isnull=False)
total = games.count()
print(f"Updating {total} games...")

updated = 0
for i, game in enumerate(games, 1):
    try:
        res = requests.get(f"https://api.rawg.io/api/games/{game.rawg_id}", params={"key": api_key}, timeout=10)
        if res.status_code == 200:
            data = res.json()
            real_count = data.get("ratings_count", 0)
            real_rating = round(data.get("rating", 0.0) * 2, 2)
            
            game.initial_rating_count = real_count
            game.initial_rating = real_rating
            game.save(update_fields=["initial_rating_count", "initial_rating"])
            game.update_avg_rating()
            updated += 1
            if updated % 10 == 0:
                print(f"Updated {updated}/{total}...")
    except Exception as e:
        print(f"Error on {game.rawg_id}: {e}")
    sleep(0.1)  # Rate limit protection

print("Done updating actual counts from RAWG!")
