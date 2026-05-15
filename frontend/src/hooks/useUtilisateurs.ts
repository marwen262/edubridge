import { useState, useEffect, useCallback } from 'react';
import { utilisateurService } from '@/services/api';
import type { Utilisateur } from '@/types/api';

// Pour admin uniquement
export function useUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    utilisateurService
      .getAll()
      .then(({ data }) => {
        if (!cancelled) setUtilisateurs((data as { utilisateurs: Utilisateur[] }).utilisateurs ?? []);
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

  return { utilisateurs, loading, error, refetch };
}
