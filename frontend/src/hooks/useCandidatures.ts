import { useState, useEffect, useCallback, useMemo } from 'react';
import { candidatureService } from '@/services/api';
import type { Candidature, CandidatureFilters, Pagination } from '@/types/api';

// Cf. usePrograms / useInstituts.
const DEFAULT_LIMIT = 100;

export function useCandidatures() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    candidatureService
      .getMine()
      .then(({ data }) => {
        if (!cancelled) setCandidatures((data as { candidatures: Candidature[] }).candidatures ?? []);
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
  }, [fetchKey]);

  return { candidatures, loading, error, refetch };
}

export function useInstitutCandidatures() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    candidatureService
      .getInstituteList()
      .then(({ data }) => {
        if (!cancelled) setCandidatures((data as { candidatures: Candidature[] }).candidatures ?? []);
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
  }, [fetchKey]);

  return { candidatures, loading, error, refetch };
}

// Pour admin uniquement — expose `pagination` (cf. backend utils/pagination.js)
export function useAllCandidatures(filters?: CandidatureFilters) {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  const effectiveFilters = useMemo<CandidatureFilters>(
    () => ({ ...filters, limit: filters?.limit ?? DEFAULT_LIMIT }),
    [filters],
  );

  const filtersKey = JSON.stringify(effectiveFilters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    candidatureService
      .getAll(effectiveFilters)
      .then(({ data }) => {
        if (cancelled) return;
        const payload = data as { candidatures?: Candidature[]; pagination?: Pagination };
        setCandidatures(payload.candidatures ?? []);
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

  return { candidatures, pagination, loading, error, refetch };
}
