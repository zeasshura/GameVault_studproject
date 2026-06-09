import React from 'react';
import { X } from 'lucide-react';
import type { Genre, Platform } from '../../types';

interface CatalogFiltersProps {
  filtersOpen: boolean;
  hasFilters: boolean;
  clearFilters: () => void;
  genres: Genre[];
  selectedGenres: number[];
  toggleGenre: (id: number) => void;
  platforms: Platform[];
  selectedPlatforms: number[];
  togglePlatform: (id: number) => void;
  yearFrom: string;
  setYearFrom: (s: string) => void;
  yearTo: string;
  setYearTo: (s: string) => void;
  minRating: string;
  setMinRating: (s: string) => void;
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  filtersOpen, hasFilters, clearFilters, genres, selectedGenres, toggleGenre,
  platforms, selectedPlatforms, togglePlatform, yearFrom, setYearFrom,
  yearTo, setYearTo, minRating, setMinRating
}) => {
  if (!filtersOpen) return null;

  return (
    <div
      className="rounded-xl p-5 mb-5 animate-slide-up"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Фильтры</h3>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: 'var(--red)' }}
            id="clear-filters-btn"
          >
            <X className="w-3 h-3" /> Сбросить
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2.5 block" style={{ color: 'var(--text-dim)' }}>
            Жанры
          </label>
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <button
                key={g.id}
                id={`filter-genre-${g.id}`}
                onClick={() => toggleGenre(g.id)}
                className="chip text-xs transition-all"
                style={{
                  background: selectedGenres.includes(g.id) ? 'var(--accent-dim)' : 'var(--bg-card)',
                  color: selectedGenres.includes(g.id) ? 'var(--accent)' : 'var(--text-muted)',
                  border: `1px solid ${selectedGenres.includes(g.id) ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2.5 block" style={{ color: 'var(--text-dim)' }}>
            Платформы
          </label>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <button
                key={p.id}
                id={`filter-platform-${p.id}`}
                onClick={() => togglePlatform(p.id)}
                className="chip text-xs transition-all"
                style={{
                  background: selectedPlatforms.includes(p.id) ? 'var(--accent-dim)' : 'var(--bg-card)',
                  color: selectedPlatforms.includes(p.id) ? 'var(--accent)' : 'var(--text-muted)',
                  border: `1px solid ${selectedPlatforms.includes(p.id) ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2.5 block" style={{ color: 'var(--text-dim)' }}>
            Год выхода
          </label>
          <div className="flex gap-2">
            <input
              id="filter-year-from"
              type="number"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="От"
              min="1970" max="2030"
              className="input-field text-sm py-2"
            />
            <input
              id="filter-year-to"
              type="number"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              placeholder="До"
              min="1970" max="2030"
              className="input-field text-sm py-2"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-2.5 block" style={{ color: 'var(--text-dim)' }}>
            Мин. рейтинг: <span style={{ color: 'var(--accent)' }}>{minRating || '0'}</span>
          </label>
          <input
            id="filter-min-rating"
            type="range"
            min="0" max="10" step="0.5"
            value={minRating || 0}
            onChange={(e) => setMinRating(e.target.value === '0' ? '' : e.target.value)}
            className="w-full"
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            <span>0</span><span>10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogFilters;
