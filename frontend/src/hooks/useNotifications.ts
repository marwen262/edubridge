import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/api';
import type { Notification } from '@/types/api';

const NOTIF_EVENT = 'notifications:updated';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  // refetch diffuse l'événement → toutes les instances rechargent (sidebar + page)
  const refetch = useCallback(() => {
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
  }, []);

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

  // Toutes les instances écoutent l'événement global — placé après les effets
  // existants pour ne pas changer l'ordre des hooks.
  useEffect(() => {
    const handler = () => setFetchKey((k) => k + 1);
    window.addEventListener(NOTIF_EVENT, handler);
    return () => window.removeEventListener(NOTIF_EVENT, handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.est_lue).length;

  return { notifications, loading, error, refetch, unreadCount };
}
