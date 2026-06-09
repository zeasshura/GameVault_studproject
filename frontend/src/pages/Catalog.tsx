import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gamesApi } from '../api/games';
import type { Game, Genre, Platform, GameFilters } from '../types';
import CatalogToolbar from './Catalog/CatalogToolbar';
import CatalogFilters from './Catalog/CatalogFilters';
import GamesGrid from './Catalog/GamesGrid';

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
    
  }, [debouncedSearch, selectedGenres, selectedPlatforms, yearFrom, yearTo, minRating, ordering]);

  useEffect(() => { fetchGames(); }, [page]);

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

  const hasFilters = Boolean(search || selectedGenres.length || selectedPlatforms.length || yearFrom || yearTo || minRating);

  return (
    <div className="min-h-screen pt-14 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="section-container py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-black mb-1" style={{ color: 'var(--text)' }}>Каталог игр</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {total > 0 ? `Найдено ${total} игр` : loading ? 'Загрузка...' : 'Ничего не найдено'}
          </p>
        </div>

        <CatalogToolbar
          search={search}
          setSearch={setSearch}
          ordering={ordering}
          setOrdering={setOrdering}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          hasFilters={hasFilters}
          sortOptions={SORT_OPTIONS}
        />

        <CatalogFilters
          filtersOpen={filtersOpen}
          hasFilters={hasFilters}
          clearFilters={clearFilters}
          genres={genres}
          selectedGenres={selectedGenres}
          toggleGenre={toggleGenre}
          platforms={platforms}
          selectedPlatforms={selectedPlatforms}
          togglePlatform={togglePlatform}
          yearFrom={yearFrom}
          setYearFrom={setYearFrom}
          yearTo={yearTo}
          setYearTo={setYearTo}
          minRating={minRating}
          setMinRating={setMinRating}
        />

        <GamesGrid
          loading={loading}
          games={games}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          setPage={setPage}
          clearFilters={clearFilters}
        />
      </div>
    </div>
  );
};

export default Catalog;
