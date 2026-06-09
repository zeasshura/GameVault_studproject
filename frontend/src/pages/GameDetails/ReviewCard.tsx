import React from 'react';
import { Link } from 'react-router-dom';
import { User, Pencil, Trash2 } from 'lucide-react';
import type { Review } from '../../types';
import { ratingColor } from './utils';

interface ReviewCardProps {
  review: Review;
  isOwner: boolean;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

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
              background: ratingColor(review.score),
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
          <span className="text-xs font-bold" style={{ color: ratingColor(review.score_gameplay) }}>{review.score_gameplay}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Сюжет</span>
          <span className="text-xs font-bold" style={{ color: ratingColor(review.score_story) }}>{review.score_story}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Графика</span>
          <span className="text-xs font-bold" style={{ color: ratingColor(review.score_graphics) }}>{review.score_graphics}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Звук</span>
          <span className="text-xs font-bold" style={{ color: ratingColor(review.score_sound) }}>{review.score_sound}</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
