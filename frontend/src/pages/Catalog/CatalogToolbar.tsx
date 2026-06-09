import React from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

interface CatalogToolbarProps {
  search: string;
  setSearch: (s: string) => void;
  ordering: string;
  setOrdering: (o: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hasFilters: boolean;
  sortOptions: { value: string; label: string }[];
}

const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
  search, setSearch, ordering, setOrdering, filtersOpen, setFiltersOpen, hasFilters, sortOptions
}) => {
  return (
    <div className="flex gap-3 mb-5 animate-slide-up">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--text-dim)' }}
        />
        <input
          id="catalog-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию..."
          className="input-field pl-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-dim)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative">
        <select
          id="catalog-sort"
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          className="input-field appearance-none cursor-pointer pr-8 w-auto"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
      </div>

      <button
        id="filter-toggle-btn"
        onClick={() => setFiltersOpen(p => !p)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{
          background: filtersOpen || hasFilters ? 'var(--accent-dim)' : 'var(--bg-card)',
          border: `1px solid ${filtersOpen || hasFilters ? 'var(--accent)' : 'var(--border)'}`,
          color: filtersOpen || hasFilters ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="hidden sm:inline">Фильтры</span>
        {hasFilters && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
      </button>
    </div>
  );
};

export default CatalogToolbar;
