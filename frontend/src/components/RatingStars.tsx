import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number; // 0–10
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (newRating: number) => void;
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
  lg: 'w-6 h-6',
};

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  size = 'md',
  interactive = false,
  onChange,
}) => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const iconClass = sizeMap[size] ?? 'w-5 h-5';

  const displayRating = rating / 2;
  const activeRating = hovered !== null ? hovered : displayRating;

  const renderStar = (index: number) => {
    const filled     = activeRating >= index;
    const halfFilled = !filled && activeRating >= index - 0.5;

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setHovered(index - (e.clientX - rect.left < rect.width / 2 ? 0.5 : 0));
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (interactive && onChange) {
        const rect = e.currentTarget.getBoundingClientRect();
        onChange((index - (e.clientX - rect.left < rect.width / 2 ? 0.5 : 0)) * 2);
      }
    };

    return (
      <button
        key={index}
        type="button"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => interactive && setHovered(null)}
        disabled={!interactive}
        className={`transition-all duration-100 ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        aria-label={`${index * 2} из 10`}
        id={interactive ? `star-btn-${index}` : undefined}
      >
        <Star
          className={iconClass}
          style={{
            fill:   filled ? 'var(--accent)' : halfFilled ? 'var(--accent)' : 'transparent',
            color:  filled || halfFilled ? 'var(--accent)' : 'var(--text-dim)',
            opacity: halfFilled ? 0.5 : 1,
            width: size === 'sm' ? 14 : size === 'lg' ? 24 : 18,
            height: size === 'sm' ? 14 : size === 'lg' ? 24 : 18,
          }}
        />
      </button>
    );
  };

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Рейтинг: ${rating} из 10`}>
      {[1, 2, 3, 4, 5].map(renderStar)}
    </div>
  );
};

export default RatingStars;
