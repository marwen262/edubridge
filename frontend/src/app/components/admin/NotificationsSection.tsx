import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Bell, BellOff, CheckCircle, Search, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, Info, Clock, Settings, ShieldAlert,
  ShieldOff, Sparkles,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useInstituts } from '@/hooks/useInstituts';
import { useAllCandidatures } from '@/hooks/useCandidatures';
import { usePrograms } from '@/hooks/usePrograms';
import { notificationService } from '@/services/api';
import i18n from '@/i18n';
import type { Notification, Institut, Candidature, Programme } from '@/types/api';

/* ─── Types ──────────────────────────────────────────────────── */
interface AlerteItem {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  source: 'systeme' | 'api';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  date?: string;
  apiNotif?: Notification;
}

/* ─── Constantes ─────────────────────────────────────────────── */
const API_TYPE_CFG: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  statut_candidature: { color: 'var(--edu-blue)',    bg: 'rgba(0,113,227,0.1)',   icon: FileText      },
  nouveau_programme:  { color: 'var(--edu-indigo)',  bg: 'rgba(99,102,241,0.1)',  icon: Info          },
  document_manquant:  { color: 'var(--edu-warning)', bg: 'rgba(255,159,10,0.1)', icon: AlertTriangle  },
  rappel_echeance:    { color: 'var(--edu-danger)',  bg: 'rgba(255,59,48,0.1)',  icon: Clock         },
  systeme:            { color: '#9CA3AF',            bg: 'rgba(156,163,175,0.1)', icon: Settings      },
};

const PAGE_SIZE = 15;

function formatRelative(d?: string): string {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return i18n.t('admin.timeAgo.justNow');
  if (m < 60) return i18n.t('admin.timeAgo.minutes', { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return i18n.t('admin.timeAgo.hours', { count: h });
  const j = Math.floor(h / 24);
  if (j < 7) return i18n.t('admin.timeAgo.days', { count: j });
  return new Date(d).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
}

/* ─── Section ────────────────────────────────────────────────── */
export function NotificationsSection() {
  const { t } = useTranslation();

  const { notifications: apiNotifs, loading: loadingApi, refetch, unreadCount } = useNotifications();
  const { instituts: institutsRaw, loading: loadingInsts } = useInstituts({ admin_view: true });
  const instituts = institutsRaw as Institut[];
  const { candidatures, loading: loadingCands } = useAllCandidatures();
  const { programs: programmes, loading: loadingProgs } = usePrograms();

  const loading = loadingApi || loadingInsts || loadingCands || loadingProgs;

  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'toutes' | 'urgentes' | 'importantes' | 'infos'>('toutes');
  const [page, setPage] = React.useState(1);
  const [markingAll, setMarkingAll] = React.useState(false);

  // ── Build unified list ──────────────────────────────────────
  const alertes: AlerteItem[] = React.useMemo(() => {
    const out: AlerteItem[] = [];
    const now = Date.now();

    // 1. API notifications réelles
    apiNotifs.forEach((n) => {
      const cfg = API_TYPE_CFG[n.type] ?? API_TYPE_CFG.systeme;
      out.push({
        id: `api-${n.id}`,
        type: 'info',
        source: 'api',
        icon: cfg.icon,
        title: n.titre ?? n.type,
        description: n.contenu ?? '',
        date: n.cree_le,
        apiNotif: n,
      });
    });

    // 2. Instituts en attente de validation
    instituts
      .filter((i) => i.validation_status === 'pending_admin_review')
      .forEach((i) => {
        out.push({
          id: `pending-${i.id}`,
          type: 'urgent',
          source: 'systeme',
          icon: ShieldAlert,
          title: i18n.t('admin.alerts.validationRequired'),
          description: i18n.t('admin.alerts.validationDesc', {
            name: i.nom ?? i.utilisateur?.email ?? i18n.t('admin.alerts.institutFallback'),
          }),
          date: i.cree_le,
        });
      });

    // 3. Nouvelles candidatures soumises (< 24h)
    (candidatures as Candidature[])
      .filter((c) => c.statut === 'soumise' && c.soumise_le)
      .filter((c) => now - new Date(c.soumise_le!).getTime() < 1000 * 60 * 60 * 24)
      .forEach((c) => {
        const nom = [c.candidat?.prenom, c.candidat?.nom].filter(Boolean).join(' ') || i18n.t('admin.alerts.candidatFallback');
        out.push({
          id: `cand-${c.id}`,
          type: 'info',
          source: 'systeme',
          icon: FileText,
          title: i18n.t('admin.alerts.newApplication'),
          description: i18n.t('admin.alerts.newApplicationDesc', {
            name: nom,
            program: c.programme?.titre ?? i18n.t('admin.alerts.programFallback'),
          }),
          date: c.soumise_le,
        });
      });

    // 4. Nouveaux instituts invités (< 7j)
    instituts
      .filter((i) => i.validation_status === 'invited' && i.cree_le)
      .filter((i) => now - new Date(i.cree_le!).getTime() < 1000 * 60 * 60 * 24 * 7)
      .forEach((i) => {
        out.push({
          id: `inv-${i.id}`,
          type: 'info',
          source: 'systeme',
          icon: Sparkles,
          title: i18n.t('admin.alerts.newInstitut'),
          description: i18n.t('admin.alerts.newInstitutDesc', {
            email: i.utilisateur?.email ?? i18n.t('admin.alerts.etablissementFallback'),
          }),
          date: i.cree_le,
        });
      });

    // 5. Programmes expirés
    (programmes as Programme[])
      .filter((p) => p.date_limite_candidature && new Date(p.date_limite_candidature).getTime() < now)
      .forEach((p) => {
        out.push({
          id: `exp-${p.id}`,
          type: 'warning',
          source: 'systeme',
          icon: AlertTriangle,
          title: i18n.t('admin.alerts.expiredProgram'),
          description: i18n.t('admin.alerts.expiredProgramDesc', { title: p.titre }),
          date: p.date_limite_candidature,
        });
      });

    // 6. Instituts suspendus
    instituts
      .filter((i) => i.validation_status === 'suspended')
      .forEach((i) => {
        out.push({
          id: `susp-${i.id}`,
          type: 'warning',
          source: 'systeme',
          icon: ShieldOff,
          title: i18n.t('admin.alerts.suspendedInstitut'),
          description: i18n.t('admin.alerts.suspendedInstitutDesc', {
            name: i.nom ?? i.utilisateur?.email,
          }),
          date: (i as unknown as { suspended_at?: string }).suspended_at ?? i.cree_le,
        });
      });

    // Déduplique et trie
    const seen = new Set<string>();
    return out
      .filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; })
      .sort((a, b) => {
        const order = { urgent: 0, warning: 1, info: 2 };
        if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
  }, [apiNotifs, instituts, candidatures, programmes]);

  // Stats
  const urgentCount = alertes.filter((a) => a.type === 'urgent').length;
  const warningCount = alertes.filter((a) => a.type === 'warning').length;
  const infoCount = alertes.filter((a) => a.type === 'info').length;

  // Filters
  const filtered = React.useMemo(() => {
    let list = alertes;
    if (filter === 'urgentes') list = list.filter((a) => a.type === 'urgent');
    else if (filter === 'importantes') list = list.filter((a) => a.type === 'warning');
    else if (filter === 'infos') list = list.filter((a) => a.type === 'info');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return list;
  }, [alertes, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => { setPage(1); }, [search, filter]);

  const handleMarkAsRead = async (id: string) => {
    try { await notificationService.markAsRead(id); refetch(); }
    catch { toast.error(t('admin.notifications.toasts.markError')); }
  };

  const handleMarkAllAsRead = async () => {
    const unread = apiNotifs.filter((n) => !n.est_lue);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => notificationService.markAsRead(n.id)));
      toast.success(t('admin.notifications.toasts.markedRead', { count: unread.length }));
      refetch();
    } catch { toast.error(t('admin.notifications.toasts.markError')); }
    finally { setMarkingAll(false); }
  };

  const stats = [
    { labelKey: 'admin.notifications.stats.total', value: alertes.length, color: 'var(--edu-text-primary)' },
    { labelKey: 'admin.notifications.stats.urgent', value: urgentCount, color: 'var(--edu-danger)' },
    { labelKey: 'admin.notifications.stats.important', value: warningCount, color: 'var(--edu-warning)' },
    { labelKey: 'admin.notifications.stats.info', value: infoCount, color: 'var(--edu-blue)' },
  ];

  const filterButtons = [
    { key: 'toutes' as const, label: t('admin.notifications.filters.all') },
    { key: 'urgentes' as const, label: urgentCount > 0 ? `${t('admin.notifications.filters.urgent')} (${urgentCount})` : t('admin.notifications.filters.urgent') },
    { key: 'importantes' as const, label: warningCount > 0 ? `${t('admin.notifications.filters.important')} (${warningCount})` : t('admin.notifications.filters.important') },
    { key: 'infos' as const, label: t('admin.notifications.filters.info') },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">{t('admin.notifications.sectionLabel')}</p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">{t('admin.notifications.title')}</h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">{t('admin.notifications.subtitle')}</p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} disabled={markingAll} className="rounded-full text-white" style={{ backgroundColor: 'var(--edu-indigo)' }}>
              <CheckCircle className="w-4 h-4 mr-2" /> {t('admin.notifications.markAllRead')}
            </Button>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.labelKey} className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-5 border border-[var(--edu-border)]">
              <p className="text-3xl font-bold tracking-tight" style={{ color: s.color }}>
                {loading ? <span className="inline-block w-10 h-8 bg-[var(--edu-surface)] rounded animate-pulse" /> : s.value}
              </p>
              <p className="text-xs text-[var(--edu-text-secondary)] mt-1">{t(s.labelKey)}</p>
            </div>
          ))}
        </motion.div>

        {/* Filtres */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input type="text" placeholder={t('admin.notifications.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterButtons.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === f.key ? 'bg-[var(--edu-indigo)] text-white' : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Liste */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
          <div className="divide-y divide-[var(--edu-divider)]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
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
                <p className="text-sm font-medium text-[var(--edu-text-primary)]">{t('admin.notifications.empty')}</p>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-1">
                  {filter !== 'toutes' ? t('admin.notifications.emptyFilter') : t('admin.notifications.emptyAll')}
                </p>
              </div>
            ) : paginated.map((a) => {
              const palType = a.type;
              const palBg = palType === 'urgent' ? 'rgba(255,59,48,0.1)' : palType === 'warning' ? 'rgba(255,159,10,0.1)' : 'rgba(0,113,227,0.1)';
              const palFg = palType === 'urgent' ? 'var(--edu-danger)' : palType === 'warning' ? 'var(--edu-warning)' : 'var(--edu-blue)';
              const palLabel = t(`admin.notifications.palette.${palType === 'warning' ? 'warning' : palType}`);
              const Icon = a.icon;
              const isApiUnread = a.apiNotif && !a.apiNotif.est_lue;

              return (
                <div key={a.id}
                  className={`px-6 py-5 flex items-start gap-4 hover:bg-[var(--edu-surface)] transition-colors ${isApiUnread ? 'bg-[var(--edu-blue)]/[0.03]' : ''}`}>
                  <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: palBg }}>
                    <Icon className="w-5 h-5" style={{ color: palFg }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className={`text-sm ${isApiUnread ? 'font-semibold' : 'font-medium'} text-[var(--edu-text-primary)]`}>{a.title}</p>
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: palBg, color: palFg }}>{palLabel}</span>
                      {a.source === 'systeme' && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-[var(--edu-surface)] text-[var(--edu-text-tertiary)]">
                          {t('admin.notifications.system')}
                        </span>
                      )}
                      {isApiUnread && <span className="w-2 h-2 rounded-full bg-[var(--edu-blue)] shrink-0" />}
                    </div>
                    {a.description && (
                      <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5 line-clamp-2">{a.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-[var(--edu-text-tertiary)]">{formatRelative(a.date)}</span>
                      {isApiUnread && a.apiNotif && (
                        <button onClick={() => handleMarkAsRead(a.apiNotif!.id)}
                          className="text-[11px] font-semibold text-[var(--edu-blue)] hover:underline">
                          {t('admin.notifications.markAsRead')}
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
              <p className="text-xs text-[var(--edu-text-tertiary)]">{t('admin.notifications.pagination', { count: filtered.length })} — {t('common.page')} {page}/{totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
