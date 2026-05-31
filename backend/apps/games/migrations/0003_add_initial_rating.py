from django.db import migrations, models
from django.db.models import F

def copy_avg_to_initial(apps, schema_editor):
    Game = apps.get_model('games', 'Game')
    Game.objects.all().update(initial_rating=F('avg_rating'))

class Migration(migrations.Migration):

    dependencies = [
        ('games', '0002_scale_rawg_ratings'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='initial_rating',
            field=models.FloatField(default=0.0, verbose_name='Изначальный рейтинг'),
        ),
        migrations.RunPython(copy_avg_to_initial, migrations.RunPython.noop),
    ]
