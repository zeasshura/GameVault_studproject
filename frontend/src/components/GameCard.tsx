import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import type { Game } from '../types';

interface GameCardProps {
  game: Game;
}

/** RAWG-style game card: 16:9 landscape cover, green rating badge, dark surface */
const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(() => {}); // catch autoplay restrictions
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  const releaseYear = game.release_date
    ? new Date(game.release_date).getFullYear()
    : null;

  const ratingColor = (r: number) => {
    if (r >= 8) return '#6dc849';   // green
    if (r >= 6) return '#f5c518';   // yellow
    if (r > 0)  return '#ff6347';   // red-orange
    return 'transparent';
  };

  return (
    <Link
      to={`/games/${game.id}`}
      className="group block glass-card h-full"
      aria-label={`Перейти к игре ${game.title}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover — 16:9 landscape, like RAWG */}
      <div className="relative aspect-video overflow-hidden"
           style={{ background: '#2a2a2a' }}>
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={`Обложка ${game.title}`}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isHovered && game.video_url ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
               style={{ background: '#2a2a2a' }}>
            <span className="text-3xl">🎮</span>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Нет изображения</span>
          </div>
        )}

        {game.video_url && (
          <video
            ref={videoRef}
            src={game.video_url}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            muted
            loop
            playsInline
          />
        )}

        {/* Rating badge — top-left, RAWG style */}
        {game.avg_rating > 0 && (
          <div
            className="absolute top-2 left-2 text-xs font-bold rounded px-1.5 py-0.5"
            style={{
              background: ratingColor(game.avg_rating),
              color: game.avg_rating >= 6 ? '#000' : '#fff',
              minWidth: '2rem',
              textAlign: 'center',
            }}
          >
            {game.avg_rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Platforms row */}
        {game.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {game.platforms.slice(0, 3).map((p) => (
              <span
                key={p.id}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}
              >
                {p.name}
              </span>
            ))}
            {game.platforms.length > 3 && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-dim)' }}
              >
                +{game.platforms.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3
          className="font-bold text-sm leading-snug mb-1.5 line-clamp-2 transition-colors duration-150"
          style={{ color: 'var(--text)' }}
        >
          {game.title}
        </h3>

        {/* Genre + year row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {game.genres.slice(0, 2).map((g) => (
              <span
                key={g.id}
                className="text-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                {g.name}
              </span>
            ))}
            {game.genres.length > 2 && (
              <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                +{game.genres.length - 2}
              </span>
            )}
          </div>
          {releaseYear && (
            <div className="flex items-center gap-0.5" style={{ color: 'var(--text-dim)' }}>
              <Calendar className="w-3 h-3" />
              <span className="text-[10px]">{releaseYear}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
