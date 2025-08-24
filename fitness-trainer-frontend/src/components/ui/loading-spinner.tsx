import { Loader2, Dumbbell } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showLogo?: boolean;
}

export function LoadingSpinner({
  size = 'md',
  text = 'Завантаження...',
  showLogo = true
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {showLogo && (
          <div className="bg-gradient-to-r from-blue-600 to-yellow-500 text-white p-3 rounded-xl">
            <Dumbbell className="h-8 w-8" />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
          {text && (
            <span className="text-gray-600 font-medium">
              {text}
            </span>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">FitnessPro</p>
          <p className="text-xs text-gray-400">🇺🇦 Українська фітнес платформа</p>
        </div>
      </div>
    </div>
  );
}

// Simple inline loading spinner for smaller use cases
export function InlineSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return <Loader2 className={`${sizeClasses[size]} animate-spin`} />;
}
