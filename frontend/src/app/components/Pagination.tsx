// Composant Pagination réutilisable — pages numérotées + Précédent/Suivant.
// Affiche au maximum 7 boutons (1 … N-1 N N+1 … total) pour rester compact
// quand le nombre de pages est élevé.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optionnel : libellé "X résultats" affiché à gauche */
  totalItems?: number;
  itemLabel?: string;
  /** Désactive tous les contrôles (ex: pendant un fetch) */
  disabled?: boolean;
  className?: string;
}

type PageEntry = number | 'ellipsis-l' | 'ellipsis-r';

function calculerPagesAffichees(page: number, totalPages: number): PageEntry[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: PageEntry[] = [1];
  if (page > 3) pages.push('ellipsis-l');
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push('ellipsis-r');
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  itemLabel = 'résultat',
  disabled = false,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) {
    // Affiche tout de même le compteur seul si demandé (utile sur listing court)
    if (totalItems !== undefined) {
      return (
        <div className={`flex items-center justify-center mt-12 ${className}`}>
          <p className="text-sm text-[var(--edu-text-tertiary)]">
            {totalItems} {itemLabel}{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  }

  const pages = calculerPagesAffichees(page, totalPages);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 mt-12 ${className}`}>
      {totalItems !== undefined && (
        <p className="text-sm text-[var(--edu-text-tertiary)] sm:mr-4">
          {totalItems} {itemLabel}{totalItems !== 1 ? 's' : ''} — page {page}/{totalPages}
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <Button
          variant="outline"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-full"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        {pages.map((p) =>
          p === 'ellipsis-l' || p === 'ellipsis-r' ? (
            <span
              key={p}
              className="px-2 text-[var(--edu-text-tertiary)] select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              disabled={disabled}
              onClick={() => onPageChange(p)}
              className={`rounded-full w-10 h-10 p-0 ${
                p === page ? 'bg-[var(--edu-blue)] text-white hover:bg-[var(--edu-blue-hover)]' : ''
              }`}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-full"
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="w-4 h-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
}
