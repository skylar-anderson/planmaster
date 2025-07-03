'use client';

import { LoadingSpinner } from '@/app/components/loading-spinner';
import { cn } from '@/lib/utils';

interface AuthLoadingProps {
  variant?: 'button' | 'avatar' | 'full';
  className?: string;
}

export function AuthLoading({ variant = 'button', className }: AuthLoadingProps) {
  if (variant === 'full') {
    return (
      <div 
        className={cn(
          'flex items-center justify-center min-h-screen',
          className
        )}
        role="main"
        aria-live="polite"
      >
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" className="text-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div 
        className={cn(
          'h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse',
          className
        )}
        role="img"
        aria-label="Loading user avatar"
      />
    );
  }

  // Button loading state
  return (
    <div 
      className={cn(
        'flex items-center space-x-2',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="sm" className="text-current" />
      <span className="text-sm">Loading...</span>
    </div>
  );
}