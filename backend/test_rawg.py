import requests
from django.conf import settings
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

api_key = settings.RAWG_API_KEY
res = requests.get(f'https://api.rawg.io/api/games/3328', params={'key': api_key})
data = res.json()
print("description_raw:", data.get('description_raw', '')[:500])
