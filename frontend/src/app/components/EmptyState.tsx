import React from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-[var(--edu-surface)] flex items-center justify-center mb-6">
        <Search className="w-12 h-12 text-[var(--edu-text-tertiary)]" />
      </div>

      <h3 className="text-2xl font-semibold text-[var(--edu-text-primary)] mb-2">{title}</h3>
      <p className="text-[var(--edu-text-secondary)] max-w-md mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
