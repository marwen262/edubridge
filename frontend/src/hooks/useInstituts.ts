import { useState, useEffect, useCallback } from 'react';
import { institutService } from '@/services/api';
import type { InstitutFilters } from '@/types/api';

export function useInstituts(filters?: InstitutFilters) {
  const [instituts, setInstituts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    institutService
      .getAll(filters)
      .then(({ data }) => {
        if (!cancelled) setInstituts((data as { instituts: unknown[] }).instituts ?? []);
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

  return { instituts, loading, error, refetch };
}
