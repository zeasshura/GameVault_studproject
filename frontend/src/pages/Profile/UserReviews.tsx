import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import RatingStars from '../../components/RatingStars';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Review } from '../../types';

interface UserReviewsProps {
  reviews: Review[];
  loadingRevs: boolean;
  isOwnProfile: boolean;
}

const UserReviews: React.FC<UserReviewsProps> = ({
  reviews,
  loadingRevs,
  isOwnProfile,
}) => {
  return (
    <div className="animate-fade-in">
      {loadingRevs ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="mb-4">
            {isOwnProfile ? 'У вас пока нет рецензий' : 'У этого пользователя нет рецензий'}
          </p>
          {isOwnProfile && (
            <Link to="/games" className="btn-primary" id="browse-to-review-link">
              Перейти в каталог
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} id={`my-review-${review.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: review.score >= 8 ? '#6dc849' : review.score >= 6 ? '#f5c518' : '#ff6347', color: review.score >= 6 ? '#000' : '#fff' }}
                  >
                    {review.score}/10
                  </span>
                  <RatingStars rating={review.score} size="sm" />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {new Date(review.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>{review.text}</p>
              <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Геймплей</span>
                  <span className="text-xs font-bold" style={{ color: review.score_gameplay >= 8 ? '#6dc849' : review.score_gameplay >= 6 ? '#f5c518' : '#ff6347' }}>{review.score_gameplay}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Сюжет</span>
                  <span className="text-xs font-bold" style={{ color: review.score_story >= 8 ? '#6dc849' : review.score_story >= 6 ? '#f5c518' : '#ff6347' }}>{review.score_story}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Графика</span>
                  <span className="text-xs font-bold" style={{ color: review.score_graphics >= 8 ? '#6dc849' : review.score_graphics >= 6 ? '#f5c518' : '#ff6347' }}>{review.score_graphics}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Звук</span>
                  <span className="text-xs font-bold" style={{ color: review.score_sound >= 8 ? '#6dc849' : review.score_sound >= 6 ? '#f5c518' : '#ff6347' }}>{review.score_sound}</span>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  to={`/games/${review.game}`}
                  className="text-xs font-medium transition-colors"
                  style={{ color: 'var(--accent)' }}
                  id={`review-game-link-${review.id}`}
                >
                  Перейти к игре →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReviews;
