import { useState, useEffect, useCallback } from 'react';
import { favoriService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { Favori } from '@/types/api';

export function useFavoris() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    // Attendre la résolution de l'auth (localStorage lu dans AuthProvider)
    if (authLoading) return;

    // Endpoint backend protégé par restrictTo('candidat') : ne pas appeler
    // pour visiteurs / institut / admin — sinon 403 → intercepteur redirige
    // vers '/' → boucle de refresh infinie sur la Home.
    if (!isAuthenticated || user?.role !== 'candidat') {
      setFavoris([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    favoriService
      .getMine()
      .then(({ data }) => {
        if (!cancelled) setFavoris((data as { favoris: Favori[] }).favoris ?? []);
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
  }, [fetchKey, authLoading, isAuthenticated, user?.role]);

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
