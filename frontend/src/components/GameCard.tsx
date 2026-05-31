import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Star } from 'lucide-react';
import type { Game } from '../types';
import RatingStars from './RatingStars';

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const releaseYear = game.release_date
    ? new Date(game.release_date).getFullYear()
    : null;

  return (
    <Link
      to={`/games/${game.id}`}
      className="group block glass-card overflow-hidden h-full"
      aria-label={`Перейти к игре ${game.title}`}
    >
      {/* Cover Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-primary-900/40 to-dark-300">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={`Обложка ${game.title}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-900/30 to-accent-900/20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/30 to-accent-500/30 flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">Нет изображения</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Rating Badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-lg px-2.5 py-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">
              {game.avg_rating > 0 ? game.avg_rating.toFixed(1) : '—'}
            </span>
          </div>
        </div>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Genres */}
          {game.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {game.genres.slice(0, 2).map((genre) => (
                <span key={genre.id} className="chip-primary text-[10px] py-0.5 px-2">
                  {genre.name}
                </span>
              ))}
              {game.genres.length > 2 && (
                <span className="chip bg-white/10 text-gray-300 text-[10px] py-0.5 px-2">
                  +{game.genres.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="text-white font-bold text-base leading-tight line-clamp-2 group-hover:text-primary-300 transition-colors duration-200">
            {game.title}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Stars */}
        <div className="flex items-center justify-between mb-3">
          <RatingStars rating={game.avg_rating} size="sm" />
          {releaseYear && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{releaseYear}</span>
            </div>
          )}
        </div>

        {/* Platforms */}
        {game.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.platforms.slice(0, 3).map((platform) => (
              <span key={platform.id} className="chip-accent text-[10px] py-0.5 px-2">
                {platform.name}
              </span>
            ))}
            {game.platforms.length > 3 && (
              <span className="chip bg-white/5 text-gray-400 text-[10px] py-0.5 px-2">
                +{game.platforms.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default GameCard;
