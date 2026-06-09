import React from 'react';
import { Gamepad2 } from 'lucide-react';
import type { Game } from '../../types';
import GameCard from '../../components/GameCard';
import Pagination from '../../components/Pagination';

const SkeletonCard: React.FC = () => (
  <div className="glass-card overflow-hidden">
    <div className="skeleton aspect-video" />
    <div className="p-3 space-y-2">
      <div className="skeleton h-3.5 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  </div>
);

interface GamesGridProps {
  loading: boolean;
  games: Game[];
  total: number;
  page: number;
  pageSize: number;
  setPage: (p: number) => void;
  clearFilters: () => void;
}

const GamesGrid: React.FC<GamesGridProps> = ({
  loading, games, total, page, pageSize, setPage, clearFilters
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (games.length > 0) {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {games.map((game, idx) => (
            <div key={game.id} className="animate-fade-in" style={{ animationDelay: `${idx * 25}ms` }}>
              <GameCard game={game} />
            </div>
          ))}
        </div>
        <Pagination currentPage={page} totalCount={total} pageSize={pageSize} onPageChange={setPage} />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-surface)' }}
      >
        <Gamepad2 className="w-8 h-8 opacity-30" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Игры не найдены</h3>
      <p className="text-sm mb-5 max-w-xs" style={{ color: 'var(--text-muted)' }}>
        Попробуйте изменить параметры поиска или сбросить фильтры.
      </p>
      <button onClick={clearFilters} className="btn-secondary" id="no-results-clear">
        Сбросить фильтры
      </button>
    </div>
  );
};

export default GamesGrid;
