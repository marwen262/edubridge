import { useState, useEffect, useCallback } from 'react';
import { programmeService } from '@/services/api';
import type { ProgrammeFilters, Programme } from '@/types/api';

export function usePrograms(filters?: ProgrammeFilters) {
  const [programs, setPrograms] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // JSON.stringify évite les re-renders infinis si filters est un littéral objet
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    programmeService
      .getAll(filters)
      .then(({ data }) => {
        if (!cancelled) setPrograms(data);
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

  return { programs, loading, error, refetch };
}
