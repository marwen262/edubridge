import { useState, useEffect, useCallback, useMemo } from 'react';
import { institutService } from '@/services/api';
import type { InstitutFilters, Pagination } from '@/types/api';

// Cf. usePrograms : default `limit` élevé pour préserver la sémantique
// historique des consommateurs qui veulent "tous les instituts" en un appel.
const DEFAULT_LIMIT = 100;

export function useInstituts(filters?: InstitutFilters) {
  const [instituts, setInstituts] = useState<unknown[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  const effectiveFilters = useMemo<InstitutFilters>(
    () => ({ ...filters, limit: filters?.limit ?? DEFAULT_LIMIT }),
    [filters],
  );

  const filtersKey = JSON.stringify(effectiveFilters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    institutService
      .getAll(effectiveFilters)
      .then(({ data }) => {
        if (cancelled) return;
        const payload = data as { instituts?: unknown[]; pagination?: Pagination };
        setInstituts(payload.instituts ?? []);
        setPagination(payload.pagination ?? null);
      })
      .catch((err) => {
        if (!cancelled)
          setError((err.response?.data?.message as string) ?? 'Erreur');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, fetchKey]);

  return { instituts, pagination, loading, error, refetch };
}
