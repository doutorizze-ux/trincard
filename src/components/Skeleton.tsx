import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  rounded = false,
  lines = 1 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  const roundedClass = rounded ? 'rounded-full' : 'rounded';
  
  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${roundedClass}`}
            style={{
              width: index === lines - 1 ? '75%' : width,
              height
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  );
};

// Componentes específicos para diferentes tipos de conteúdo
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <Skeleton height="1.5rem" className="mb-3" />
    <Skeleton lines={2} height="1rem" className="mb-4" />
    <div className="flex justify-between items-center">
      <Skeleton width="30%" height="1rem" />
      <Skeleton width="20%" height="2rem" rounded />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, index) => (
        <Skeleton key={`header-${index}`} height="1.25rem" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="1rem" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <Skeleton width="3rem" height="3rem" rounded />
        <div className="flex-1">
          <Skeleton height="1.25rem" className="mb-2" />
          <Skeleton height="1rem" width="60%" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;