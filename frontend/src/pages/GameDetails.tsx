import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Star,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  User,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { gamesApi } from '../api/games';
import { reviewsApi } from '../api/reviews';
import { collectionsApi } from '../api/collections';
import type { Game, Review, Collection } from '../types';
import { useAuthStore } from '../store/auth';
import RatingStars from '../components/RatingStars';
import LoadingSpinner from '../components/LoadingSpinner';

const COLLECTION_NAMES = ['Играю', 'Прошёл', 'Хочу сыграть', 'Брошено'];

const GameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');

  // Review form
  const [reviewText, setReviewText] = useState('');
  const [reviewScore, setReviewScore] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Edit review
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editText, setEditText] = useState('');
  const [editScore, setEditScore] = useState(8);

  // Collection dropdown
  const [collectionDropdown, setCollectionDropdown] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [collectionMsg, setCollectionMsg] = useState('');

  useEffect(() => {
    if (game) document.title = `${game.title} — GameVault`;
    else document.title = 'Игра — GameVault';
  }, [game]);

  const fetchGame = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await gamesApi.getGame(id);
      setGame(data);
    } catch {
      setError('Не удалось загрузить игру');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const data = await reviewsApi.getReviews(id);
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  const fetchCollections = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await collectionsApi.getCollections();
      setCollections(data);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    fetchGame();
    fetchReviews();
    fetchCollections();
  }, [fetchGame, fetchReviews, fetchCollections]);

  const myReview = reviews.find((r) => r.user.id === user?.id);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reviewText.trim()) return;
    setSubmitting(true);
    setReviewError('');
    try {
      await reviewsApi.createReview(id, { text: reviewText, score: reviewScore });
      setReviewText('');
      setReviewScore(8);
      await fetchReviews();
      await fetchGame();
    } catch {
      setReviewError('Не удалось отправить рецензию. Возможно, вы уже оставляли её.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Удалить рецензию?')) return;
    try {
      await reviewsApi.deleteReview(reviewId);
      await fetchReviews();
      await fetchGame();
    } catch {}
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setSubmitting(true);
    try {
      await reviewsApi.updateReview(editingReview.id, { text: editText, score: editScore });
      setEditingReview(null);
      await fetchReviews();
      await fetchGame();
    } catch {
      setReviewError('Не удалось обновить рецензию');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCollection = async (collectionId: number, collectionName: string) => {
    if (!game) return;
    setAddingToCollection(true);
    setCollectionDropdown(false);
    try {
      await collectionsApi.addGameToCollection(collectionId, game.id);
      setCollectionMsg(`Добавлено в «${collectionName}»`);
      setTimeout(() => setCollectionMsg(''), 3000);
    } catch {
      setCollectionMsg('Ошибка при добавлении');
      setTimeout(() => setCollectionMsg(''), 3000);
    } finally {
      setAddingToCollection(false);
    }
  };

  const createAndAddToCollection = async (name: string) => {
    if (!game) return;
    setAddingToCollection(true);
    setCollectionDropdown(false);
    try {
      const col = await collectionsApi.createCollection(name);
      await collectionsApi.addGameToCollection(col.id, game.id);
      setCollections((prev) => [...prev, col]);
      setCollectionMsg(`Добавлено в «${name}»`);
      setTimeout(() => setCollectionMsg(''), 3000);
    } catch {
      setCollectionMsg('Ошибка');
      setTimeout(() => setCollectionMsg(''), 3000);
    } finally {
      setAddingToCollection(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center">
        <p className="text-2xl text-red-400 font-bold mb-2">Ошибка</p>
        <p className="text-gray-500">{error || 'Игра не найдена'}</p>
      </div>
    );
  }

  const releaseYear = game.release_date ? new Date(game.release_date).getFullYear() : null;
  const releaseFormatted = game.release_date
    ? new Date(game.release_date).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen pt-20 pb-16 animate-fade-in">
      {/* ── Hero ──────────────────────────────────────── */}
      <div className="relative">
        {/* Background blur */}
        {game.cover_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl"
            style={{ backgroundImage: `url(${game.cover_url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-300/50 to-[var(--color-bg)]" />

        <div className="relative section-container py-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover */}
            <div className="flex-shrink-0">
              <div className="w-48 md:w-64 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={`Обложка ${game.title}`}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-gradient-to-br from-primary-900/40 to-accent-900/20 flex items-center justify-center">
                    <span className="text-5xl">🎮</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                {game.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <RatingStars rating={game.avg_rating} size="lg" />
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold text-yellow-400">
                    {game.avg_rating > 0 ? game.avg_rating.toFixed(1) : '—'}
                  </span>
                  <span className="text-gray-500 text-sm">/ 10</span>
                </div>
              </div>

              {/* Meta */}
              {releaseFormatted && (
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{releaseFormatted}</span>
                  {releaseYear && <span className="text-gray-600">({releaseYear})</span>}
                </div>
              )}

              {/* Genres */}
              {game.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {game.genres.map((g) => (
                    <span key={g.id} className="chip-primary">{g.name}</span>
                  ))}
                </div>
              )}

              {/* Platforms */}
              {game.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {game.platforms.map((p) => (
                    <span key={p.id} className="chip-accent">{p.name}</span>
                  ))}
                </div>
              )}

              {/* Add to Collection */}
              {isAuthenticated && (
                <div className="relative inline-block">
                  <button
                    id="add-to-collection-btn"
                    onClick={() => setCollectionDropdown((p) => !p)}
                    disabled={addingToCollection}
                    className="btn-primary gap-2"
                  >
                    {addingToCollection ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Добавить в коллекцию
                    <ChevronDown className={`w-4 h-4 transition-transform ${collectionDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {collectionDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-56 glass shadow-xl rounded-xl overflow-hidden z-20 animate-fade-in">
                      {/* Existing collections */}
                      {collections.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-white/10">
                            Мои коллекции
                          </div>
                          {collections.map((col) => (
                            <button
                              key={col.id}
                              id={`add-to-collection-${col.id}`}
                              onClick={() => handleAddToCollection(col.id, col.name)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-primary-500/10 hover:text-primary-300 transition-colors"
                            >
                              {col.name}
                            </button>
                          ))}
                          <div className="border-t border-white/10" />
                        </>
                      )}
                      {/* Preset new collections */}
                      <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                        Создать коллекцию
                      </div>
                      {COLLECTION_NAMES.map((name) => (
                        <button
                          key={name}
                          id={`create-collection-${name}`}
                          onClick={() => createAndAddToCollection(name)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-accent-500/10 hover:text-accent-300 transition-colors"
                        >
                          + {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {collectionMsg && (
                <p className="mt-2 text-sm text-accent-400 animate-fade-in">{collectionMsg}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Description ───────────────────────────────── */}
      {game.description && (
        <section className="section-container mb-12">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-400" />
              Описание
            </h2>
            <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{game.description}</p>
          </div>
        </section>
      )}

      {/* ── Reviews ───────────────────────────────────── */}
      <section className="section-container">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-400" />
          Рецензии
          {reviews.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-1">({reviews.length})</span>
          )}
        </h2>

        {/* Write Review Form */}
        {isAuthenticated && !myReview && (
          <form
            onSubmit={handleSubmitReview}
            className="glass rounded-2xl p-6 mb-8 animate-slide-up"
            id="review-form"
          >
            <h3 className="font-semibold text-white mb-4">Написать рецензию</h3>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Оценка</label>
              <div className="flex items-center gap-4">
                <RatingStars
                  rating={reviewScore}
                  size="lg"
                  interactive
                  onChange={(v) => setReviewScore(v)}
                />
                <span className="text-2xl font-bold text-yellow-400">{reviewScore}/10</span>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="review-text" className="block text-sm text-gray-400 mb-2">
                Текст рецензии
              </label>
              <textarea
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                placeholder="Поделитесь впечатлениями об игре..."
                className="input-field resize-none"
                required
              />
            </div>

            {reviewError && (
              <p className="text-red-400 text-sm mb-3">{reviewError}</p>
            )}

            <button
              type="submit"
              id="submit-review-btn"
              disabled={submitting || !reviewText.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <LoadingSpinner size="sm" /> : null}
              Опубликовать
            </button>
          </form>
        )}

        {/* My Review */}
        {isAuthenticated && myReview && (
          <div className="mb-8">
            {editingReview?.id === myReview.id ? (
              <form onSubmit={handleUpdateReview} className="glass rounded-2xl p-6 border border-primary-500/30 animate-slide-up">
                <h3 className="font-semibold text-white mb-4">Редактировать рецензию</h3>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Оценка</label>
                  <div className="flex items-center gap-4">
                    <RatingStars rating={editScore} size="lg" interactive onChange={setEditScore} />
                    <span className="text-2xl font-bold text-yellow-400">{editScore}/10</span>
                  </div>
                </div>
                <textarea
                  id="edit-review-text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  className="input-field resize-none mb-4"
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary" id="save-review-btn" disabled={submitting}>
                    {submitting ? <LoadingSpinner size="sm" /> : null}
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingReview(null)}
                    className="btn-secondary"
                    id="cancel-edit-btn"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <ReviewCard
                review={myReview}
                isOwner
                onEdit={() => {
                  setEditingReview(myReview);
                  setEditText(myReview.text);
                  setEditScore(myReview.score);
                }}
                onDelete={() => handleDeleteReview(myReview.id)}
              />
            )}
          </div>
        )}

        {/* All Reviews */}
        {reviewsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Рецензий пока нет. Будьте первым!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews
              .filter((r) => r.user.id !== user?.id)
              .map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isOwner={false}
                  isAdmin={user?.role === 'admin'}
                  onDelete={() => handleDeleteReview(review.id)}
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
};

interface ReviewCardProps {
  review: Review;
  isOwner: boolean;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, isOwner, isAdmin, onEdit, onDelete }) => {
  const dateStr = new Date(review.created_at).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={`glass rounded-2xl p-5 ${isOwner ? 'border border-primary-500/30' : ''}`}
      id={`review-${review.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${review.user.id}`} className="block cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
              {review.user.username[0]?.toUpperCase()}
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${review.user.id}`}
                className="font-semibold text-white text-sm hover:text-primary-400 hover:underline transition-colors cursor-pointer"
              >
                {review.user.username}
              </Link>
              {isOwner && (
                <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">
                  Вы
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <User className="w-3 h-3" />
              <span>{dateStr}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-2.5 py-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{review.score}</span>
          </div>
          {(isOwner || isAdmin) && (
            <div className="flex gap-1 ml-2">
              {isOwner && onEdit && (
                <button
                  id={`edit-review-${review.id}`}
                  onClick={onEdit}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary-300 hover:bg-primary-500/10 transition-colors"
                  aria-label="Редактировать рецензию"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  id={`delete-review-${review.id}`}
                  onClick={onDelete}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Удалить рецензию"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{review.text}</p>
    </div>
  );
};

export default GameDetails;
