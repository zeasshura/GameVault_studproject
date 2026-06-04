import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
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

const ratingColor = (r: number) => {
  if (r >= 8) return '#6dc849';
  if (r >= 6) return '#f5c518';
  if (r > 0)  return '#ff6347';
  return 'var(--text-dim)';
};

const GameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviewText, setReviewText] = useState('');
  const [reviewGameplay, setReviewGameplay] = useState(8);
  const [reviewStory, setReviewStory] = useState(8);
  const [reviewGraphics, setReviewGraphics] = useState(8);
  const [reviewSound, setReviewSound] = useState(8);
  const reviewScore = Math.round((reviewGameplay + reviewStory + reviewGraphics + reviewSound) / 4);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editText, setEditText] = useState('');
  const [editGameplay, setEditGameplay] = useState(8);
  const [editStory, setEditStory] = useState(8);
  const [editGraphics, setEditGraphics] = useState(8);
  const [editSound, setEditSound] = useState(8);
  const editScore = Math.round((editGameplay + editStory + editGraphics + editSound) / 4);

  const [collectionDropdown, setCollectionDropdown] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [collectionMsg, setCollectionMsg] = useState('');

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

  const myReview = reviews.find((r) => r.user.id === user?.id);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reviewText.trim()) return;
    setSubmitting(true); setReviewError('');
    try {
      await reviewsApi.createReview(id, {
        text: reviewText,
        score: reviewScore,
        score_gameplay: reviewGameplay,
        score_story: reviewStory,
        score_graphics: reviewGraphics,
        score_sound: reviewSound
      });
      setReviewText('');
      setReviewGameplay(8); setReviewStory(8); setReviewGraphics(8); setReviewSound(8);
      await fetchReviews(); await fetchGame();
    } catch { setReviewError('Не удалось отправить рецензию. Возможно, вы уже оставляли её.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Удалить рецензию?')) return;
    try { await reviewsApi.deleteReview(reviewId); await fetchReviews(); await fetchGame(); } catch {}
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setSubmitting(true);
    try {
      await reviewsApi.updateReview(editingReview.id, {
        text: editText,
        score: editScore,
        score_gameplay: editGameplay,
        score_story: editStory,
        score_graphics: editGraphics,
        score_sound: editSound
      });
      setEditingReview(null);
      await fetchReviews(); await fetchGame();
    } catch { setReviewError('Не удалось обновить рецензию'); }
    finally { setSubmitting(false); }
  };

  const handleAddToCollection = async (collectionId: number, name: string) => {
    if (!game) return;
    setAddingToCollection(true); setCollectionDropdown(false);
    try {
      await collectionsApi.addGameToCollection(collectionId, game.id);
      setCollectionMsg(`Добавлено в «${name}»`);
    } catch { setCollectionMsg('Ошибка при добавлении'); }
    finally { setAddingToCollection(false); setTimeout(() => setCollectionMsg(''), 3000); }
  };

  const createAndAddToCollection = async (name: string) => {
    if (!game) return;
    setAddingToCollection(true); setCollectionDropdown(false);
    try {
      const col = await collectionsApi.createCollection(name);
      await collectionsApi.addGameToCollection(col.id, game.id);
      setCollections(prev => [...prev, col]);
      setCollectionMsg(`Добавлено в «${name}»`);
    } catch { setCollectionMsg('Ошибка'); }
    finally { setAddingToCollection(false); setTimeout(() => setCollectionMsg(''), 3000); }
  };

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

  const releaseFormatted = game.release_date
    ? new Date(game.release_date).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen pt-14 pb-16 animate-fade-in" style={{ background: 'var(--bg)' }}>

      {/* ── Hero backdrop ──────────────────────────────── */}
      <div className="relative" style={{ background: 'var(--bg-surface)' }}>
        {/* Blurred background art */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {game.cover_url && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10 blur-2xl scale-110"
              style={{ backgroundImage: `url(${game.cover_url})` }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--bg-surface) 100%)' }}
          />
        </div>

        <div className="relative section-container py-10">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Cover art */}
            <div className="flex-shrink-0">
              <div
                className="w-44 md:w-56 mx-auto md:mx-0 rounded-xl overflow-hidden shadow-2xl"
                style={{ border: '1px solid var(--border)' }}
              >
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={game.title}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div
                    className="w-full aspect-[3/4] flex items-center justify-center"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <span className="text-4xl">🎮</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--text)' }}>
                {game.title}
              </h1>

              {/* Rating row */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="text-lg font-black px-3 py-1 rounded-lg"
                  style={{
                    background: game.avg_rating > 0 ? ratingColor(game.avg_rating) : 'var(--bg-card)',
                    color: game.avg_rating >= 6 ? '#000' : '#fff',
                  }}
                >
                  {game.avg_rating > 0 ? game.avg_rating.toFixed(1) : '—'}
                </div>
                <RatingStars rating={game.avg_rating} size="md" />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {reviews.length > 0 ? `${reviews.length} рецензий` : 'Нет рецензий'}
                </span>
              </div>

              {/* Release date */}
              {releaseFormatted && (
                <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-4 h-4" />
                  <span>{releaseFormatted}</span>
                </div>
              )}

              {/* Genres */}
              {game.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {game.genres.map((g) => (
                    <span key={g.id} className="chip-primary text-xs">{g.name}</span>
                  ))}
                </div>
              )}

              {/* Platforms */}
              {game.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {game.platforms.map((p) => (
                    <span key={p.id} className="chip-accent text-xs">{p.name}</span>
                  ))}
                </div>
              )}

              {/* Add to collection */}
              {isAuthenticated && (
                <div className="relative inline-block">
                  <button
                    id="add-to-collection-btn"
                    onClick={() => setCollectionDropdown(p => !p)}
                    disabled={addingToCollection}
                    className="btn-primary"
                  >
                    {addingToCollection ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
                    В коллекцию
                    <ChevronDown className={`w-4 h-4 transition-transform ${collectionDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {collectionDropdown && (
                    <div
                      className="absolute top-full left-0 mt-1 w-52 rounded-xl overflow-hidden z-50 animate-fade-in"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      {collections.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                            Мои коллекции
                          </div>
                          {collections.map((col) => (
                            <button
                              key={col.id}
                              id={`add-to-collection-${col.id}`}
                              onClick={() => handleAddToCollection(col.id, col.name)}
                              className="w-full text-left px-4 py-2 text-sm transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                              {col.name}
                            </button>
                          ))}
                          <div style={{ borderTop: '1px solid var(--border)' }} />
                        </>
                      )}
                      <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                        Создать коллекцию
                      </div>
                      {COLLECTION_NAMES.map((name) => (
                        <button
                          key={name}
                          id={`create-collection-${name}`}
                          onClick={() => createAndAddToCollection(name)}
                          className="w-full text-left px-4 py-2 text-sm transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          + {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {collectionMsg && (
                <p className="mt-2 text-sm animate-fade-in" style={{ color: 'var(--accent)' }}>{collectionMsg}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Description ────────────────────────────────── */}
      {game.description && (
        <section className="section-container mt-8 mb-8">
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              Описание
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
              {game.description}
            </p>
          </div>
        </section>
      )}

      {/* ── Reviews ────────────────────────────────────── */}
      <section className="section-container">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <MessageSquare className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          Рецензии
          {reviews.length > 0 && (
            <span className="text-sm font-normal" style={{ color: 'var(--text-dim)' }}>({reviews.length})</span>
          )}
        </h2>

        {/* Write review form */}
        {isAuthenticated && !myReview && (
          <form
            onSubmit={handleSubmitReview}
            className="rounded-xl p-5 mb-6 animate-slide-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            id="review-form"
          >
            <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text)' }}>Написать рецензию</h3>

            <div className="mb-4">
              <label className="block text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Критерии оценки</label>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs w-24" style={{ color: 'var(--text)' }}>Геймплей</span>
                  <input type="range" min="1" max="10" value={reviewGameplay} onChange={(e) => setReviewGameplay(Number(e.target.value))} className="flex-1" />
                  <span className="text-xs font-bold w-6 text-right" style={{ color: ratingColor(reviewGameplay) }}>{reviewGameplay}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs w-24" style={{ color: 'var(--text)' }}>Сюжет</span>
                  <input type="range" min="1" max="10" value={reviewStory} onChange={(e) => setReviewStory(Number(e.target.value))} className="flex-1" />
                  <span className="text-xs font-bold w-6 text-right" style={{ color: ratingColor(reviewStory) }}>{reviewStory}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs w-24" style={{ color: 'var(--text)' }}>Графика</span>
                  <input type="range" min="1" max="10" value={reviewGraphics} onChange={(e) => setReviewGraphics(Number(e.target.value))} className="flex-1" />
                  <span className="text-xs font-bold w-6 text-right" style={{ color: ratingColor(reviewGraphics) }}>{reviewGraphics}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs w-24" style={{ color: 'var(--text)' }}>Звук</span>
                  <input type="range" min="1" max="10" value={reviewSound} onChange={(e) => setReviewSound(Number(e.target.value))} className="flex-1" />
                  <span className="text-xs font-bold w-6 text-right" style={{ color: ratingColor(reviewSound) }}>{reviewSound}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Итоговый балл:</span>
                <span
                  className="text-xl font-bold px-2 py-0.5 rounded"
                  style={{ background: ratingColor(reviewScore), color: reviewScore >= 6 ? '#000' : '#fff' }}
                >
                  {reviewScore}/10
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="review-text" className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
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
              <p className="text-sm mb-3" style={{ color: 'var(--red)' }}>{reviewError}</p>
            )}

            <button
              type="submit"
              id="submit-review-btn"
              disabled={submitting || !reviewText.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" /> : null}
              Опубликовать
            </button>
          </form>
        )}

        {/* My review */}
        {isAuthenticated && myReview && (
          <div className="mb-6">
            {editingReview?.id === myReview.id ? (
              <form
                onSubmit={handleUpdateReview}
                className="rounded-xl p-5 animate-slide-up"
                style={{ background: 'var(--bg-surface)', border: `1px solid var(--accent)` }}
              >
                <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text)' }}>Редактировать рецензию</h3>
                <div className="mb-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs w-24" style={{ color: 'var(--text)' }}>Геймплей</span>
                      <input type="range" min="1" max="10" value={editGameplay} onChange={(e) => setEditGameplay(Number(e.target.value))} className="flex-1" />
                      <span className="text-xs font-bold w-6 text-right" style={{ color: ratingColor(editGameplay) }}>{editGameplay}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs w-24" style={{ color: 'var(--text)' }}>Сюжет</span>
                      <input type="range" min="1" max="10" value={editStory} onChange={(e) => setEditStory(Number(e.target.value))} className="flex-1" />
                      <span className="text-xs font-bold w-6 text-right" style={{ color: ratingColor(editStory) }}>{editStory}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs w-24" style={{ color: 'var(--text)' }}>Графика</span>
                      <input type="range" min="1" max="10" value={editGraphics} onChange={(e) => setEditGraphics(Number(e.target.value))} className="flex-1" />
                      <span className="text-xs font-bold w-6 text-right" style={{ color: ratingColor(editGraphics) }}>{editGraphics}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs w-24" style={{ color: 'var(--text)' }}>Звук</span>
                      <input type="range" min="1" max="10" value={editSound} onChange={(e) => setEditSound(Number(e.target.value))} className="flex-1" />
                      <span className="text-xs font-bold w-6 text-right" style={{ color: ratingColor(editSound) }}>{editSound}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold px-2 py-0.5 rounded"
                      style={{ background: ratingColor(editScore), color: editScore >= 6 ? '#000' : '#fff' }}>
                      {editScore}/10
                    </span>
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
                  <button type="button" onClick={() => setEditingReview(null)} className="btn-secondary" id="cancel-edit-btn">
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <ReviewCard review={myReview} isOwner
                onEdit={() => { 
                  setEditingReview(myReview); 
                  setEditText(myReview.text); 
                  setEditGameplay(myReview.score_gameplay);
                  setEditStory(myReview.score_story);
                  setEditGraphics(myReview.score_graphics);
                  setEditSound(myReview.score_sound);
                }}
                onDelete={() => handleDeleteReview(myReview.id)}
              />
            )}
          </div>
        )}

        {/* All reviews */}
        {reviewsLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Рецензий пока нет. Будьте первым!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.filter(r => r.user.id !== user?.id).map((review) => (
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

/* ── ReviewCard ─────────────────────────────────────────── */
interface ReviewCardProps {
  review: Review;
  isOwner: boolean;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ratingColorLocal = (r: number) => {
  if (r >= 8) return '#6dc849';
  if (r >= 6) return '#f5c518';
  if (r > 0)  return '#ff6347';
  return 'var(--text-dim)';
};

const ReviewCard: React.FC<ReviewCardProps> = ({ review, isOwner, isAdmin, onEdit, onDelete }) => {
  const dateStr = new Date(review.created_at).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${isOwner ? 'var(--accent)' : 'var(--border)'}`,
      }}
      id={`review-${review.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${review.user.id}`}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-black text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              {review.user.username[0]?.toUpperCase()}
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${review.user.id}`}
                className="font-semibold text-sm transition-colors"
                style={{ color: 'var(--text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text)')}
              >
                {review.user.username}
              </Link>
              {isOwner && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  Вы
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              <User className="w-3 h-3" />
              <span>{dateStr}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="text-sm font-bold px-2 py-0.5 rounded"
            style={{
              background: ratingColorLocal(review.score),
              color: review.score >= 6 ? '#000' : '#fff',
            }}
          >
            {review.score}/10
          </div>
          {(isOwner || isAdmin) && (
            <div className="flex gap-1">
              {isOwner && onEdit && (
                <button
                  id={`edit-review-${review.id}`}
                  onClick={onEdit}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  aria-label="Редактировать"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  id={`delete-review-${review.id}`}
                  onClick={onDelete}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  aria-label="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3" style={{ color: 'var(--text-muted)' }}>
        {review.text}
      </p>
      <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Геймплей</span>
          <span className="text-xs font-bold" style={{ color: ratingColorLocal(review.score_gameplay) }}>{review.score_gameplay}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Сюжет</span>
          <span className="text-xs font-bold" style={{ color: ratingColorLocal(review.score_story) }}>{review.score_story}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Графика</span>
          <span className="text-xs font-bold" style={{ color: ratingColorLocal(review.score_graphics) }}>{review.score_graphics}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Звук</span>
          <span className="text-xs font-bold" style={{ color: ratingColorLocal(review.score_sound) }}>{review.score_sound}</span>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;
