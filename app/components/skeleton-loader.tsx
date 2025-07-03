'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      role="presentation"
      aria-hidden="true"
    />
  );
}

export function UserAvatarSkeleton() {
  return (
    <div 
      className="flex items-center space-x-3"
      role="status"
      aria-label="Loading user profile"
    >
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2 hidden sm:block">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-3 w-[80px]" />
      </div>
    </div>
  );
}

export function ButtonSkeleton({ className }: SkeletonProps) {
  return (
    <Skeleton 
      className={cn(
        'h-10 w-24 rounded-md',
        className
      )}
      role="status"
      aria-label="Loading button"
    />
  );
}