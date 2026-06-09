import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { reviewsApi } from '../../api/reviews';
import type { Review } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ratingColor } from './utils';
import ReviewCard from './ReviewCard';
import { useAuthStore } from '../../store/auth';

interface ReviewsSectionProps {
  gameId: string;
  reviews: Review[];
  reviewsLoading: boolean;
  fetchReviews: () => Promise<void>;
  fetchGame: () => Promise<void>;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  gameId,
  reviews,
  reviewsLoading,
  fetchReviews,
  fetchGame,
}) => {
  const { isAuthenticated, user } = useAuthStore();
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

  const myReview = reviews.find((r) => r.user.id === user?.id);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId || !reviewText.trim()) return;
    setSubmitting(true); setReviewError('');
    try {
      await reviewsApi.createReview(gameId, {
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

  return (
    <section className="section-container">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <MessageSquare className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        Рецензии
        {reviews.length > 0 && (
          <span className="text-sm font-normal" style={{ color: 'var(--text-dim)' }}>({reviews.length})</span>
        )}
      </h2>

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
  );
};

export default ReviewsSection;
