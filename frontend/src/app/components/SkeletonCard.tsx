import React from 'react';

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="h-48 skeleton-shimmer" />
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg skeleton-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-5 skeleton-shimmer rounded w-3/4" />
            <div className="h-4 skeleton-shimmer rounded w-1/2" />
          </div>
        </div>
        <div className="h-4 skeleton-shimmer rounded w-full" />
        <div className="h-4 skeleton-shimmer rounded w-2/3" />
      </div>
    </div>
  );
}
