import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/api';
import type { Notification } from '@/types/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    notificationService
      .getMine()
      .then(({ data }) => {
        if (!cancelled)
          setNotifications((data as { notifications: Notification[] }).notifications ?? []);
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

  const unreadCount = notifications.filter((n) => !n.est_lue).length;

  return { notifications, loading, error, refetch, unreadCount };
}
