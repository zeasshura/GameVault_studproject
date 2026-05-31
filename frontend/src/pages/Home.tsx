import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Star, TrendingUp, ChevronRight, Gamepad2 } from 'lucide-react';
import { gamesApi } from '../api/games';
import type { Game, Genre } from '../types';
import GameCard from '../components/GameCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuthStore } from '../store/auth';

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

      if (topRes.status === 'fulfilled') {
        setTopGames(topRes.value.results.slice(0, 10));
      }
      if (newRes.status === 'fulfilled') {
        setNewGames(newRes.value.results.slice(0, 8));
      }
      if (genreRes.status === 'fulfilled' && genreRes.value.length > 0) {
        setGenres(genreRes.value.slice(0, 8));
      } else {
        setGenres(GENRES_MOCK);
      }
    } catch {
      setGenres(GENRES_MOCK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 hero-gradient" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative section-container text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-500/30 text-primary-300 text-sm font-medium mb-8">
            <Zap className="w-4 h-4 text-accent-400" />
            Тысячи игр в одном месте
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
            <span className="block text-gray-900 dark:text-white">Добро пожаловать</span>
            <span className="block gradient-text">в GameVault</span>
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Открывайте, отслеживайте и оценивайте видеоигры. Ведите персональную библиотеку, пишите рецензии и делитесь опытом.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/games" className="btn-primary text-base px-8 py-4" id="hero-cta-catalog">
              Смотреть каталог
              <ArrowRight className="w-5 h-5" />
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn-secondary text-base px-8 py-4" id="hero-cta-register">
                Начать бесплатно
              </Link>
            )}
          </div>


        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-center justify-center">
            <div className="w-1 h-3 bg-primary-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Genre Chips ─────────────────────────────────── */}
      {genres.length > 0 && (
        <section className="py-12 border-y border-white/5">
          <div className="section-container">
            <div className="flex flex-wrap gap-3 justify-center">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  id={`genre-chip-${genre.id}`}
                  onClick={() => navigate(`/games?genre=${genre.id}`)}
                  className="chip-primary cursor-pointer text-sm py-2 px-5 hover:bg-primary-500/40 transition-all hover:scale-105"
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Rated Section ────────────────────────────── */}
      <section className="py-16">
        <div className="section-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                Топ игр
              </h2>
              <p className="text-gray-500 text-sm mt-1">Самые высокооценённые игры</p>
            </div>
            <Link
              to="/games?ordering=-avg_rating"
              className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 text-sm font-medium transition-colors"
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
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {idx < 3 && (
                    <div
                      className={`absolute -top-2 -left-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-lg
                        ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}
                    >
                      #{idx + 1}
                    </div>
                  )}
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Игры ещё не добавлены</p>
            </div>
          )}
        </div>
      </section>

      {/* ── New Releases Section ─────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-primary-900/10 to-accent-900/5">
        <div className="section-container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Zap className="w-7 h-7 text-accent-500 dark:text-accent-400" />
                Новинки
              </h2>
              <p className="text-gray-500 text-sm mt-1">Свежие поступления в каталог</p>
            </div>
            <Link
              to="/games?ordering=-release_date"
              className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 text-sm font-medium transition-colors"
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
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Игры ещё не добавлены</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="py-20">
          <div className="section-container">
            <div className="glass rounded-3xl p-10 md:p-16 text-center relative overflow-hidden animate-pulse-glow">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-accent-600/10 rounded-3xl" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                  Готовы начать?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                  Создайте аккаунт бесплатно и начните строить свою игровую библиотеку прямо сейчас.
                </p>
                <Link to="/register" className="btn-primary text-base px-10 py-4" id="banner-cta">
                  Создать аккаунт
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
