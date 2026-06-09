import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { gamesApi } from '../api/games';
import { reviewsApi } from '../api/reviews';
import { collectionsApi } from '../api/collections';
import type { Game, Review, Collection } from '../types';
import { useAuthStore } from '../store/auth';
import LoadingSpinner from '../components/LoadingSpinner';

import GameHero from './GameDetails/GameHero';
import GameAbout from './GameDetails/GameAbout';
import ReviewsSection from './GameDetails/ReviewsSection';

const GameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = game ? `${game.title} — GameVault` : 'Игра — GameVault';
  }, [game]);

  const fetchGame = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try { setGame(await gamesApi.getGame(id)); }
    catch { setError('Не удалось загрузить игру'); }
    finally { setLoading(false); }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try { setReviews(await reviewsApi.getReviews(id)); }
    catch { setReviews([]); }
    finally { setReviewsLoading(false); }
  }, [id]);

  const fetchCollections = useCallback(async () => {
    if (!isAuthenticated) return;
    try { setCollections(await collectionsApi.getCollections()); } catch {}
  }, [isAuthenticated]);

  useEffect(() => { fetchGame(); fetchReviews(); fetchCollections(); },
    [fetchGame, fetchReviews, fetchCollections]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-14">
      <LoadingSpinner size="xl" />
    </div>
  );

  if (error || !game) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-14 text-center">
      <p className="text-2xl font-bold mb-2" style={{ color: 'var(--red)' }}>Ошибка</p>
      <p style={{ color: 'var(--text-muted)' }}>{error || 'Игра не найдена'}</p>
    </div>
  );

  return (
    <div className="min-h-screen pt-14 pb-16 animate-fade-in" style={{ background: 'var(--bg)' }}>
      <GameHero 
        game={game} 
        reviewCount={reviews.length} 
        collections={collections} 
        setCollections={setCollections} 
      />
      <GameAbout description={game.description} />
      <ReviewsSection 
        gameId={id as string} 
        reviews={reviews} 
        reviewsLoading={reviewsLoading} 
        fetchReviews={fetchReviews} 
        fetchGame={fetchGame} 
      />
    </div>
  );
};

export default GameDetails;
