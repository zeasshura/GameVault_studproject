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
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  size = 'md',
  interactive = false,
  onChange,
}) => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const iconClass = sizeMap[size];

  // Convert 0-10 to 0-5 scale
  const displayRating = rating / 2;
  const activeRating = hovered !== null ? hovered : displayRating;

  const renderStar = (index: number) => {
    // index is 1-based
    const filled = activeRating >= index;
    const halfFilled = !filled && activeRating >= index - 0.5;

    const starClass = filled || halfFilled ? 'star-filled' : 'star-empty';

    const handleClick = () => {
      if (interactive && onChange) {
        // Convert back to 0-10: clicking star N = N*2
        onChange(index * 2);
      }
    };

    const handleMouseEnter = () => {
      if (interactive) setHovered(index);
    };

    return (
      <button
        key={index}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => interactive && setHovered(null)}
        disabled={!interactive}
        className={`${starClass} transition-all duration-100 ${
          interactive
            ? 'cursor-pointer hover:scale-125 active:scale-110'
            : 'cursor-default'
        }`}
        aria-label={`${index * 2} из 10`}
        id={interactive ? `star-btn-${index}` : undefined}
      >
        <Star
          className={`${iconClass} ${
            filled
              ? 'fill-yellow-400 text-yellow-400'
              : halfFilled
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'fill-transparent text-gray-500 dark:text-gray-600'
          }`}
        />
      </button>
    );
  };

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Рейтинг: ${rating} из 10`}
    >
      {[1, 2, 3, 4, 5].map((i) => renderStar(i))}
    </div>
  );
};

export default RatingStars;
