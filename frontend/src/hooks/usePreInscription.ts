import { useState, useEffect, useCallback } from 'react';
import { preInscriptionService } from '@/services/api';
import type { PreInscription } from '@/types/api';

export function usePreInscription(candidatureId: string) {
  const [preInscription, setPreInscription] = useState<PreInscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!candidatureId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    preInscriptionService
      .getMine(candidatureId)
      .then(({ data }) => {
        if (!cancelled) {
          const payload = data as { preInscription: PreInscription | null };
          setPreInscription(payload.preInscription);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // 404 = pas encore de pré-inscription, état normal
        if ((err as { response?: { status?: number } }).response?.status === 404) {
          setPreInscription(null);
        } else {
          setError(
            (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [candidatureId, fetchKey]);

  return { preInscription, loading, error, refetch };
}
