from django.db import migrations
from django.db.models import F

def scale_ratings(apps, schema_editor):
    Game = apps.get_model('games', 'Game')
    # Удваиваем рейтинги всех игр из RAWG (которые <= 5.0)
    Game.objects.filter(rawg_id__isnull=False, avg_rating__lte=5.0).update(
        avg_rating=F('avg_rating') * 2
    )

def reverse_scale_ratings(apps, schema_editor):
    Game = apps.get_model('games', 'Game')
    # Делим рейтинги обратно
    Game.objects.filter(rawg_id__isnull=False).update(
        avg_rating=F('avg_rating') / 2
    )

class Migration(migrations.Migration):

    dependencies = [
        ('games', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(scale_ratings, reverse_scale_ratings),
    ]
