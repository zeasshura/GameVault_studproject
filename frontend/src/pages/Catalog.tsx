import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Gamepad2, ChevronDown } from 'lucide-react';
import { gamesApi } from '../api/games';
import type { Game, Genre, Platform, GameFilters } from '../types';
import GameCard from '../components/GameCard';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: '-avg_rating',   label: 'По рейтингу ↓' },
  { value: 'avg_rating',    label: 'По рейтингу ↑' },
  { value: '-release_date', label: 'Сначала новые' },
  { value: 'release_date',  label: 'Сначала старые' },
  { value: 'title',         label: 'По названию А-Я' },
  { value: '-title',        label: 'По названию Я-А' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SkeletonCard: React.FC = () => (
  <div className="glass-card overflow-hidden">
    <div className="skeleton aspect-video" />
    <div className="p-3 space-y-2">
      <div className="skeleton h-3.5 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  </div>
);

const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    searchParams.get('genre')
      ? searchParams.get('genre')!.split(',').map(Number).filter(Boolean)
      : []
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>(
    searchParams.get('platform')
      ? searchParams.get('platform')!.split(',').map(Number).filter(Boolean)
      : []
  );
  const [yearFrom, setYearFrom] = useState(searchParams.get('year_from') ?? '');
  const [yearTo, setYearTo]     = useState(searchParams.get('year_to') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') ?? '');
  const [ordering, setOrdering]   = useState(searchParams.get('ordering') ?? '-avg_rating');
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'));

  const debouncedSearch = useDebounce(search, 300);
  const firstRender = useRef(true);

  useEffect(() => { document.title = 'Каталог — GameVault'; }, []);

  useEffect(() => {
    (async () => {
      try {
        const [g, p] = await Promise.all([gamesApi.getGenres(), gamesApi.getPlatforms()]);
        setGenres(g); setPlatforms(p);
      } catch {}
    })();
  }, []);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const params: GameFilters = { page, ordering };
      if (debouncedSearch)        params.search   = debouncedSearch;
      if (selectedGenres.length)  params.genre    = selectedGenres.join(',');
      if (selectedPlatforms.length) params.platform = selectedPlatforms.join(',');
      if (yearFrom) params.year_from  = yearFrom;
      if (yearTo)   params.year_to    = yearTo;
      if (minRating) params.min_rating = minRating;
      const result = await gamesApi.getGames(params);
      setGames(result.results);
      setTotal(result.count);
    } catch {
      setGames([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, ordering, debouncedSearch, selectedGenres, selectedPlatforms, yearFrom, yearTo, minRating]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; fetchGames(); return; }
    setPage(1); fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedGenres, selectedPlatforms, yearFrom, yearTo, minRating, ordering]);

  useEffect(() => { fetchGames(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p: Record<string, string> = {};
    if (search)                 p.search   = search;
    if (selectedGenres.length)  p.genre    = selectedGenres.join(',');
    if (selectedPlatforms.length) p.platform = selectedPlatforms.join(',');
    if (yearFrom) p.year_from  = yearFrom;
    if (yearTo)   p.year_to    = yearTo;
    if (minRating) p.min_rating = minRating;
    if (ordering !== '-avg_rating') p.ordering = ordering;
    if (page !== 1) p.page = String(page);
    setSearchParams(p, { replace: true });
  }, [search, selectedGenres, selectedPlatforms, yearFrom, yearTo, minRating, ordering, page, setSearchParams]);

  const toggleGenre    = (id: number) => setSelectedGenres(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);
  const togglePlatform = (id: number) => setSelectedPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const clearFilters = () => {
    setSearch(''); setSelectedGenres([]); setSelectedPlatforms([]);
    setYearFrom(''); setYearTo(''); setMinRating('');
    setOrdering('-avg_rating'); setPage(1);
  };

  const hasFilters = search || selectedGenres.length || selectedPlatforms.length || yearFrom || yearTo || minRating;

  return (
    <div className="min-h-screen pt-14 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="section-container py-8">

        {/* Page header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--text)' }}>Каталог игр</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {total > 0 ? `Найдено ${total} игр` : loading ? 'Загрузка...' : 'Ничего не найдено'}
          </p>
        </div>

        {/* Search + sort bar */}
        <div className="flex gap-3 mb-5 animate-slide-up">
          {/* Search */}
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

          {/* Sort */}
          <div className="relative">
            <select
              id="catalog-sort"
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="input-field appearance-none cursor-pointer pr-8 w-auto"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>

          {/* Filter toggle */}
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

        {/* Filter panel */}
        {filtersOpen && (
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
              {/* Genres */}
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

              {/* Platforms */}
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

              {/* Year range */}
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

              {/* Min rating */}
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
        )}

        {/* Games grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : games.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {games.map((game, idx) => (
                <div key={game.id} className="animate-fade-in" style={{ animationDelay: `${idx * 25}ms` }}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalCount={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default Catalog;
