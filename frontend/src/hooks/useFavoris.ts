import { useState, useEffect, useCallback } from 'react';
import { favoriService } from '@/services/api';
import type { Favori } from '@/types/api';

export function useFavoris() {
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    favoriService
      .getMine()
      .then(({ data }) => {
        if (!cancelled) setFavoris(data as Favori[]);
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

  return { favoris, loading, error, refetch };
}

export function useToggleFavori() {
  const [loading, setLoading] = useState(false);

  // Retourne true si le favori a été ajouté, false si supprimé
  const toggle = useCallback(async (programmeId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data } = await favoriService.toggle(programmeId);
      // Le backend retourne { message, favori? } — favori présent = ajouté
      return !!data.favori;
    } finally {
      setLoading(false);
    }
  }, []);

  return { toggle, loading };
}
