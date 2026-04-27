import { useState, useEffect } from 'react';
import { programmeService } from '@/services/api';
import type { Programme } from '@/types/api';

export function useProgramDetail(id: string | undefined) {
  const [program, setProgram] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setProgram(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    programmeService
      .getById(id)
      .then(({ data }) => {
        // Backend retourne { programme: {...} }
        if (!cancelled) setProgram(data.programme);
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

  return { program, loading, error };
}

