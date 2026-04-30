import { useState, useEffect, useCallback, useMemo } from 'react';
import { programmeService } from '@/services/api';
import type { Pagination, Programme, ProgrammeFilters } from '@/types/api';

// Limite par défaut quand le caller ne précise rien — préserve le comportement
// historique (avant pagination) des consommateurs qui veulent "tous les programmes
// d'un coup" pour calculer des stats ou pour des listings non paginés.
// Les pages qui veulent une vraie pagination passent un `limit` plus petit.
const DEFAULT_LIMIT = 100;

export function usePrograms(filters?: ProgrammeFilters) {
  const [programs, setPrograms] = useState<Programme[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // Filtres effectifs envoyés au backend : applique le default `limit` si absent.
  const effectiveFilters = useMemo<ProgrammeFilters>(
    () => ({ ...filters, limit: filters?.limit ?? DEFAULT_LIMIT }),
    [filters],
  );

  const filtersKey = JSON.stringify(effectiveFilters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    programmeService
      .getAll(effectiveFilters)
      .then(({ data }) => {
        if (cancelled) return;
        const payload = data as { programmes?: Programme[]; pagination?: Pagination };
        // Le backend renvoie { programmes: [...] } ; on tolère aussi un tableau brut.
        const liste = Array.isArray(payload.programmes)
          ? payload.programmes
          : Array.isArray(data)
            ? (data as Programme[])
            : [];
        setPrograms(liste);
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

  return { programs, pagination, loading, error, refetch };
}
