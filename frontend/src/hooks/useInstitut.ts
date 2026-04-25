import { useState, useEffect } from 'react';
import { institutService } from '@/services/api';
import type { Institut } from '@/types/api';

export function useInstitut(id: string | undefined) {
  const [institut, setInstitut] = useState<Institut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setInstitut(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    institutService
      .getById(id)
      .then(({ data }) => {
        if (!cancelled) setInstitut(data as Institut);
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
  }, [id]);

  return { institut, loading, error };
}
