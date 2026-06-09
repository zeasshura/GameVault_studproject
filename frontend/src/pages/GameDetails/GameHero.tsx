import React from 'react';
import { Calendar } from 'lucide-react';
import type { Game, Collection } from '../../types';
import RatingStars from '../../components/RatingStars';
import { ratingColor } from './utils';
import CollectionDropdown from './CollectionDropdown';
import { useAuthStore } from '../../store/auth';

interface GameHeroProps {
  game: Game;
  reviewCount: number;
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
}

const GameHero: React.FC<GameHeroProps> = ({ game, reviewCount, collections, setCollections }) => {
  const { isAuthenticated } = useAuthStore();
  
  const releaseFormatted = game.release_date
    ? new Date(game.release_date).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="relative" style={{ background: 'var(--bg-surface)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {game.cover_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl scale-110"
            style={{ backgroundImage: `url(${game.cover_url})` }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--bg-surface) 100%)' }}
        />
      </div>

      <div className="relative section-container py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <div
              className="w-44 md:w-56 mx-auto md:mx-0 rounded-xl overflow-hidden shadow-2xl"
              style={{ border: '1px solid var(--border)' }}
            >
              {game.cover_url ? (
                <img
                  src={game.cover_url}
                  alt={game.title}
                  className="w-full aspect-[3/4] object-cover"
                />
              ) : (
                <div
                  className="w-full aspect-[3/4] flex items-center justify-center"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <span className="text-4xl">🎮</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--text)' }}>
              {game.title}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="text-lg font-black px-3 py-1 rounded-lg"
                style={{
                  background: game.avg_rating > 0 ? ratingColor(game.avg_rating) : 'var(--bg-card)',
                  color: game.avg_rating >= 6 ? '#000' : '#fff',
                }}
              >
                {game.avg_rating > 0 ? game.avg_rating.toFixed(1) : '—'}
              </div>
              <RatingStars rating={game.avg_rating} size="md" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {reviewCount > 0 ? `${reviewCount} рецензий` : 'Нет рецензий'}
              </span>
            </div>

            {releaseFormatted && (
              <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-4 h-4" />
                <span>{releaseFormatted}</span>
              </div>
            )}

            {game.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {game.genres.map((g) => (
                  <span key={g.id} className="chip-primary text-xs">{g.name}</span>
                ))}
              </div>
            )}

            {game.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {game.platforms.map((p) => (
                  <span key={p.id} className="chip-accent text-xs">{p.name}</span>
                ))}
              </div>
            )}

            {isAuthenticated && (
              <CollectionDropdown game={game} collections={collections} setCollections={setCollections} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHero;
