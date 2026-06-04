import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Загрузка...">
      <div
        className={`${sizeMap[size]} rounded-full animate-spin`}
        style={{ borderStyle: 'solid', borderColor: 'rgba(109,200,73,0.2)', borderTopColor: 'var(--accent)' }}
      />
      <span className="sr-only">Загрузка...</span>
    </div>
  );
};

export default LoadingSpinner;
