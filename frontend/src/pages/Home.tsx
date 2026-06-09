import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Zap, ChevronRight, Gamepad2, TrendingUp } from 'lucide-react';
import { gamesApi } from '../api/games';
import type { Game, Genre } from '../types';
import GameCard from '../components/GameCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuthStore } from '../store/auth';
import { useEffect, useState, useCallback } from 'react';

const GENRES_MOCK: Genre[] = [
  { id: 1, name: 'Экшн' },
  { id: 2, name: 'РПГ' },
  { id: 3, name: 'Стратегия' },
  { id: 4, name: 'Спорт' },
  { id: 5, name: 'Приключения' },
  { id: 6, name: 'Симулятор' },
];

const Home: React.FC = () => {
  const [topGames, setTopGames] = useState<Game[]>([]);
  const [newGames, setNewGames] = useState<Game[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    document.title = 'GameVault — Игровая библиотека';
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [topRes, newRes, genreRes] = await Promise.allSettled([
        gamesApi.getGames({ ordering: '-avg_rating', page: 1 }),
        gamesApi.getGames({ ordering: '-release_date', page: 1 }),
        gamesApi.getGenres(),
      ]);
      if (topRes.status === 'fulfilled') setTopGames(topRes.value.results.slice(0, 10));
      if (newRes.status === 'fulfilled') setNewGames(newRes.value.results.slice(0, 8));
      if (genreRes.status === 'fulfilled' && genreRes.value.length > 0) {
        setGenres(genreRes.value.slice(0, 10));
      } else {
        setGenres(GENRES_MOCK);
      }
    } catch {
      setGenres(GENRES_MOCK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        className="pt-28 pb-20 px-4"
        style={{ background: 'var(--bg)' }}
      >
        <div className="section-container">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Игровая библиотека
            </div>

            <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-5" style={{ color: 'var(--text)' }}>
              Открывайте<br />
              <span style={{ color: 'var(--accent)' }}>лучшие игры</span>
            </h1>

            <p className="text-lg mb-8 max-w-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Ведите персональную библиотеку, пишите рецензии, отслеживайте прогресс и делитесь впечатлениями.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/games" className="btn-primary text-sm px-6 py-3" id="hero-cta-catalog">
                Смотреть каталог
                <ArrowRight className="w-4 h-4" />
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn-secondary text-sm px-6 py-3" id="hero-cta-register">
                  Начать бесплатно
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Genre pills ──────────────────────────────────── */}
      {genres.length > 0 && (
        <section className="py-6" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="section-container">
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  id={`genre-chip-${genre.id}`}
                  onClick={() => navigate(`/games?genre=${genre.id}`)}
                  className="text-sm px-4 py-1.5 rounded-full transition-all duration-150 font-medium cursor-pointer"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Rated ────────────────────────────────────── */}
      <section className="py-12">
        <div className="section-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Star className="w-5 h-5" style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
                Топ по рейтингу
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Самые высокооценённые игры
              </p>
            </div>
            <Link
              to="/games?ordering=-avg_rating"
              className="flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              id="top-games-see-all"
            >
              Все <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : topGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {topGames.map((game, idx) => (
                <div
                  key={game.id}
                  className="animate-fade-in relative"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Rank badge for top-3 */}
                  {idx < 3 && (
                    <div
                      className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded text-xs font-black text-white flex items-center justify-center"
                      style={{
                        background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32',
                        color: '#000',
                      }}
                    >
                      {idx + 1}
                    </div>
                  )}
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: 'var(--text-dim)' }}>
              <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Игры ещё не добавлены</p>
            </div>
          )}
        </div>
      </section>

      {/* ── New Releases ─────────────────────────────────── */}
      <section className="py-12" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="section-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                Новинки
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Свежие поступления
              </p>
            </div>
            <Link
              to="/games?ordering=-release_date"
              className="flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              id="new-releases-see-all"
            >
              Все <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : newGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {newGames.map((game, idx) => (
                <div
                  key={game.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: 'var(--text-dim)' }}>
              <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Игры ещё не добавлены</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="py-20">
          <div className="section-container">
            <div
              className="rounded-2xl p-10 md:p-16 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)' }}>
                Готовы начать?
              </h2>
              <p className="mb-8 max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
                Создайте аккаунт бесплатно и начните строить свою игровую библиотеку.
              </p>
              <Link to="/register" className="btn-primary text-sm px-8 py-3" id="banner-cta">
                Создать аккаунт
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
