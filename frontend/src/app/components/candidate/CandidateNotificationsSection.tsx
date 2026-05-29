import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Bell, BellOff, CheckCircle, Search, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, Info, Clock, Settings,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/api';
import i18n from '@/i18n';
import type { Notification } from '@/types/api';

const TYPE_STYLE: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  statut_candidature: { color: 'var(--edu-blue)',          bg: 'rgba(0,113,227,0.1)',    icon: FileText },
  nouveau_programme:  { color: 'var(--edu-indigo)',         bg: 'rgba(99,102,241,0.1)',   icon: Info },
  document_manquant:  { color: 'var(--edu-warning)',        bg: 'rgba(255,159,10,0.1)',   icon: AlertTriangle },
  rappel_echeance:    { color: 'var(--edu-danger)',         bg: 'rgba(255,59,48,0.1)',    icon: Clock },
  systeme:            { color: 'var(--edu-text-secondary)', bg: 'rgba(156,163,175,0.1)', icon: Settings },
};

const PAGE_SIZE = 15;

function formatRel(d?: string): string {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j} j`;
  return new Date(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
}

export function CandidateNotificationsSection() {
  const { t } = useTranslation();
  const { notifications, loading, refetch, unreadCount } = useNotifications();
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'toutes' | 'non_lues' | 'lues'>('toutes');
  const [page, setPage] = React.useState(1);
  const [markingAll, setMarkingAll] = React.useState(false);

  const filtered = React.useMemo(() => {
    let list = notifications;
    if (filter === 'non_lues') list = list.filter((n) => !n.est_lue);
    if (filter === 'lues') list = list.filter((n) => n.est_lue);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) =>
        (n.titre ?? '').toLowerCase().includes(q) ||
        (n.contenu ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [notifications, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => { setPage(1); }, [search, filter]);

  const handleRead = async (id: string) => {
    try { await notificationService.markAsRead(id); refetch(); }
    catch { toast.error(t('common.error')); }
  };

  const handleReadAll = async () => {
    setMarkingAll(true);
    try {
      await Promise.all(
        notifications.filter((n) => !n.est_lue).map((n) => notificationService.markAsRead(n.id))
      );
      toast.success(t('institution.notifications.toasts.allMarkedRead'));
      refetch();
    } catch { toast.error(t('common.error')); }
    finally { setMarkingAll(false); }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
              MON ESPACE
            </p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Notifications</h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">Centre de notifications</p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleReadAll}
              disabled={markingAll}
              className="rounded-full text-white"
              style={{ backgroundColor: 'var(--edu-blue)' }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('institution.notifications.markAllRead')}
            </Button>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input
              type="text"
              placeholder="Rechercher une notification…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
            />
          </div>
          <div className="flex gap-2">
            {(['toutes', 'non_lues', 'lues'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === f ? 'bg-[var(--edu-blue)] text-white' : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'}`}
              >
                {f === 'toutes' ? 'Toutes' : f === 'non_lues' ? 'Non lues' : 'Lues'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Liste */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden"
        >
          <div className="divide-y divide-[var(--edu-divider)]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--edu-surface)] animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-[var(--edu-surface)] rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : paginated.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <BellOff className="w-10 h-10 mx-auto mb-3 text-[var(--edu-text-tertiary)]" />
                <p className="text-sm font-medium text-[var(--edu-text-primary)]">Aucune notification</p>
              </div>
            ) : paginated.map((n: Notification) => {
              const cfg = TYPE_STYLE[n.type] ?? TYPE_STYLE.systeme;
              const Icon = cfg.icon;
              const typeLabel = n.type.replace(/_/g, ' ');
              return (
                <div
                  key={n.id}
                  className={`px-6 py-5 flex items-start gap-4 hover:bg-[var(--edu-surface)] transition-colors ${!n.est_lue ? 'bg-[var(--edu-blue)]/[0.03]' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className={`text-sm ${!n.est_lue ? 'font-semibold' : 'font-medium'} text-[var(--edu-text-primary)]`}>
                        {n.titre ?? n.type}
                      </p>
                      <span
                        className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        {typeLabel}
                      </span>
                      {!n.est_lue && (
                        <span className="w-2 h-2 rounded-full bg-[var(--edu-blue)]" />
                      )}
                    </div>
                    {n.contenu && (
                      <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5 line-clamp-2">{n.contenu}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-[var(--edu-text-tertiary)]">{formatRel(n.cree_le)}</span>
                      {!n.est_lue && (
                        <button
                          onClick={() => handleRead(n.id)}
                          className="text-[11px] font-semibold text-[var(--edu-blue)] hover:underline"
                        >
                          Marquer comme lue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--edu-text-tertiary)]">
                {filtered.length} notification{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
