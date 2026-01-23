import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${className}`} role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Carregando...
      </span>
    </div>
  );
};

// Componente de carregamento de página otimizado
export const PageLoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-blue-600 mb-4" />
        <p className="text-gray-600 text-lg">Carregando página...</p>
      </div>
    </div>
  );
};

// Componente de carregamento inline otimizado
export const InlineLoadingSpinner: React.FC<{ text?: string }> = ({ text = "Carregando..." }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" className="text-blue-600 mr-3" />
      <span className="text-gray-600">{text}</span>
    </div>
  );
};

export default LoadingSpinner;
