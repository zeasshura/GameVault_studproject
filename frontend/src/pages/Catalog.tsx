import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Gamepad2, ChevronDown } from 'lucide-react';
import { gamesApi } from '../api/games';
import type { Game, Genre, Platform, GameFilters } from '../types';
import GameCard from '../components/GameCard';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: '-avg_rating', label: 'По рейтингу ↓' },
  { value: 'avg_rating', label: 'По рейтингу ↑' },
  { value: '-release_date', label: 'Сначала новые' },
  { value: 'release_date', label: 'Сначала старые' },
  { value: 'title', label: 'По названию А-Я' },
  { value: '-title', label: 'По названию Я-А' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const SkeletonCard: React.FC = () => (
  <div className="glass-card overflow-hidden">
    <div className="skeleton aspect-[3/4]" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-4 w-3/4" />
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

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    searchParams.get('genre')
      ? searchParams.get('genre')!.split(',').map((x) => parseInt(x)).filter((x) => !isNaN(x))
      : []
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>(
    searchParams.get('platform')
      ? searchParams.get('platform')!.split(',').map((x) => parseInt(x)).filter((x) => !isNaN(x))
      : []
  );
  const [yearFrom, setYearFrom] = useState(searchParams.get('year_from') ?? '');
  const [yearTo, setYearTo] = useState(searchParams.get('year_to') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') ?? '');
  const [ordering, setOrdering] = useState(searchParams.get('ordering') ?? '-avg_rating');
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'));

  const debouncedSearch = useDebounce(search, 300);
  const firstRender = useRef(true);

  useEffect(() => {
    document.title = 'Каталог — GameVault';
  }, []);

  // Fetch genres and platforms once
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [g, p] = await Promise.all([gamesApi.getGenres(), gamesApi.getPlatforms()]);
        setGenres(g);
        setPlatforms(p);
      } catch {}
    };
    fetchMeta();
  }, []);

  // Fetch games when filters change
  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const params: GameFilters = {
        page,
        ordering,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedGenres.length > 0) params.genre = selectedGenres.join(',');
      if (selectedPlatforms.length > 0) params.platform = selectedPlatforms.join(',');
      if (yearFrom) params.year_from = yearFrom;
      if (yearTo) params.year_to = yearTo;
      if (minRating) params.min_rating = minRating;

      const result = await gamesApi.getGames(params);
      setGames(result.results);
      setTotal(result.count);
    } catch {
      setGames([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, ordering, debouncedSearch, selectedGenres, selectedPlatforms, yearFrom, yearTo, minRating]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      fetchGames();
      return;
    }
    setPage(1);
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedGenres, selectedPlatforms, yearFrom, yearTo, minRating, ordering]);

  useEffect(() => {
    fetchGames();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL params
  useEffect(() => {
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (selectedGenres.length) p.genre = selectedGenres.join(',');
    if (selectedPlatforms.length) p.platform = selectedPlatforms.join(',');
    if (yearFrom) p.year_from = yearFrom;
    if (yearTo) p.year_to = yearTo;
    if (minRating) p.min_rating = minRating;
    if (ordering !== '-avg_rating') p.ordering = ordering;
    if (page !== 1) p.page = String(page);
    setSearchParams(p, { replace: true });
  }, [search, selectedGenres, selectedPlatforms, yearFrom, yearTo, minRating, ordering, page, setSearchParams]);

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const togglePlatform = (id: number) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedGenres([]);
    setSelectedPlatforms([]);
    setYearFrom('');
    setYearTo('');
    setMinRating('');
    setOrdering('-avg_rating');
    setPage(1);
  };

  const hasFilters =
    search || selectedGenres.length || selectedPlatforms.length || yearFrom || yearTo || minRating;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="section-container">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
            Каталог игр
          </h1>
          <p className="text-gray-500">
            {total > 0 ? `Найдено ${total} игр` : loading ? 'Загрузка...' : 'Ничего не найдено'}
          </p>
        </div>

        {/* Search + Sort Bar */}
        <div className="flex gap-3 mb-6 animate-slide-up">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="catalog-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск игр..."
              className="input-field pl-11 dark:bg-dark-50/40"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
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
              className="input-field pr-8 appearance-none cursor-pointer w-auto pl-4 dark:bg-dark-50/40"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Filter Toggle */}
          <button
            id="filter-toggle-btn"
            onClick={() => setFiltersOpen((p) => !p)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 font-medium text-sm
              ${
                filtersOpen || hasFilters
                  ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-primary-500/40 hover:text-gray-200'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Фильтры</span>
            {hasFilters && (
              <span className="w-2 h-2 bg-primary-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {filtersOpen && (
          <div className="glass rounded-2xl p-6 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Фильтры</h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  id="clear-filters-btn"
                >
                  <X className="w-3 h-3" />
                  Сбросить
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Genres */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                  Жанры
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      id={`filter-genre-${genre.id}`}
                      onClick={() => toggleGenre(genre.id)}
                      className={`chip text-xs transition-all ${
                        selectedGenres.includes(genre.id)
                          ? 'bg-primary-500/40 text-primary-200 border border-primary-400'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-primary-500/20 hover:text-primary-300'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                  Платформы
                </label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      id={`filter-platform-${platform.id}`}
                      onClick={() => togglePlatform(platform.id)}
                      className={`chip text-xs transition-all ${
                        selectedPlatforms.includes(platform.id)
                          ? 'bg-accent-500/40 text-accent-200 border border-accent-400'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-accent-500/20 hover:text-accent-300'
                      }`}
                    >
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year Range */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                  Год выхода
                </label>
                <div className="flex gap-2">
                  <input
                    id="filter-year-from"
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="От"
                    min="1970"
                    max="2030"
                    className="input-field text-sm py-2"
                  />
                  <input
                    id="filter-year-to"
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="До"
                    min="1970"
                    max="2030"
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>

              {/* Min Rating */}
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
                  Мин. рейтинг: {minRating || '0'}
                </label>
                <input
                  id="filter-min-rating"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minRating || 0}
                  onChange={(e) => setMinRating(e.target.value === '0' ? '' : e.target.value)}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Games Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : games.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {games.map((game, idx) => (
                <div
                  key={game.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <GameCard game={game} />
                </div>
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalCount={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary-500/10 flex items-center justify-center mb-4">
              <Gamepad2 className="w-10 h-10 text-primary-400 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Игры не найдены</h3>
            <p className="text-gray-500 max-w-sm mb-6">
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
