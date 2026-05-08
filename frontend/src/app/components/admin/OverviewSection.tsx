import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  Users,
  Building2,
  FileText,
  Clock,
  ShieldAlert,
  TrendingUp,
  CheckCircle,
  ShieldOff,
  Bell,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';

import { Button } from '../ui/button';
import { useUtilisateurs } from '@/hooks/useUtilisateurs';
import { useAllCandidatures } from '@/hooks/useCandidatures';
import { usePrograms } from '@/hooks/usePrograms';
import { useInstituts } from '@/hooks/useInstituts';
import { useNotifications } from '@/hooks/useNotifications';
import { institutService } from '@/services/api';
import i18n from '@/i18n';
import type { Utilisateur, Institut, Candidature, Programme } from '@/types/api';

interface OverviewSectionProps {
  nomAdmin: string;
}

interface AdminNotification {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  date?: string;
}

const PIE_COLORS = ['var(--edu-blue)', 'var(--edu-indigo)', 'var(--edu-warning)'];

function formatRelative(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return i18n.t('admin.timeAgo.justNow');
  if (minutes < 60) return i18n.t('admin.timeAgo.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return i18n.t('admin.timeAgo.hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return i18n.t('admin.timeAgo.days', { count: days });
  return date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
}

export function OverviewSection({ nomAdmin }: OverviewSectionProps) {
  const { t } = useTranslation();
  const { utilisateurs: utilisateursRaw, loading: loadingUsers } = useUtilisateurs();
  const utilisateurs = utilisateursRaw as Utilisateur[];

  const { candidatures, loading: loadingCands } = useAllCandidatures();
  const { programs: programmes, loading: loadingProgs } = usePrograms();
  const {
    instituts: institutsRaw,
    loading: loadingInsts,
    refetch: refetchInsts,
  } = useInstituts({ admin_view: true });
  const instituts = institutsRaw as Institut[];

  const [enAttente, setEnAttente] = React.useState<Institut[]>([]);
  const [loadingPending, setLoadingPending] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const chargerEnAttente = React.useCallback(async () => {
    setLoadingPending(true);
    try {
      const { data } = await institutService.listerEnAttente();
      const payload = data as { instituts?: Institut[] };
      setEnAttente(payload.instituts ?? []);
    } catch {
      // silencieux
    } finally {
      setLoadingPending(false);
    }
  }, []);

  React.useEffect(() => {
    chargerEnAttente();
  }, [chargerEnAttente]);

  // ── KPIs ────────────────────────────────────────────────────
  const totalCandidats = utilisateurs.filter((u) => u.role === 'candidat').length;
  const totalInstituts = utilisateurs.filter((u) => u.role === 'institut').length;
  const totalAdmins = utilisateurs.filter((u) => u.role === 'admin').length;

  const candidaturesEnAttente = candidatures.filter(
    (c) => c.statut === 'soumise' || c.statut === 'en_examen'
  ).length;

  const institutsNonVerifies = instituts.filter((i) => !i.est_verifie).length;

  const tauxAcceptation =
    candidatures.length > 0
      ? Math.round(
          (candidatures.filter((c) => c.statut === 'acceptee').length /
            candidatures.length) *
            100
        )
      : 0;

  const kpis = [
    {
      label: t('admin.overview.kpis.users'),
      value: utilisateurs.length,
      icon: Users,
      color: 'var(--edu-indigo)',
      loading: loadingUsers,
      href: '/dashboard/admin/utilisateurs',
    },
    {
      label: t('admin.overview.kpis.instituts'),
      value: totalInstituts,
      icon: Building2,
      color: 'var(--edu-blue)',
      loading: loadingUsers,
      href: '/dashboard/admin/instituts',
    },
    {
      label: t('admin.overview.kpis.programs'),
      value: programmes.length,
      icon: FileText,
      color: 'var(--edu-info)',
      loading: loadingProgs,
      href: '/dashboard/admin/programmes',
    },
    {
      label: t('admin.overview.kpis.pendingApplications'),
      value: candidaturesEnAttente,
      icon: Clock,
      color: 'var(--edu-warning)',
      loading: loadingCands,
      href: '/dashboard/admin/candidatures',
    },
    {
      label: t('admin.overview.kpis.unverifiedInstituts'),
      value: institutsNonVerifies,
      icon: ShieldAlert,
      color: 'var(--edu-danger)',
      loading: loadingInsts,
      href: '/dashboard/admin/instituts',
    },
    {
      label: t('admin.overview.kpis.acceptanceRate'),
      value: `${tauxAcceptation}%`,
      icon: TrendingUp,
      color: 'var(--edu-success)',
      loading: loadingCands,
      href: '/dashboard/admin/candidatures',
    },
  ];

  // ── Données graphiques ──────────────────────────────────────
  const dataRoles = [
    { name: t('admin.overview.analytics.roles.candidats'), value: totalCandidats },
    { name: t('admin.overview.analytics.roles.instituts'), value: totalInstituts },
    { name: t('admin.overview.analytics.roles.admins'), value: totalAdmins },
  ].filter((d) => d.value > 0);

  const dataStatuts = [
    { statut: t('admin.overview.analytics.statuts.soumises'), count: candidatures.filter((c) => c.statut === 'soumise').length, fill: 'var(--edu-blue)' },
    { statut: t('admin.overview.analytics.statuts.en_examen'), count: candidatures.filter((c) => c.statut === 'en_examen').length, fill: 'var(--edu-warning)' },
    { statut: t('admin.overview.analytics.statuts.acceptees'), count: candidatures.filter((c) => c.statut === 'acceptee').length, fill: 'var(--edu-success)' },
    { statut: t('admin.overview.analytics.statuts.refusees'), count: candidatures.filter((c) => c.statut === 'refusee').length, fill: 'var(--edu-danger)' },
    { statut: t('admin.overview.analytics.statuts.liste_attente'), count: candidatures.filter((c) => c.statut === 'liste_attente').length, fill: '#8B5CF6' },
  ];

  // Croissance mensuelle (12 derniers mois)
  const dataCroissance = React.useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(i18n.language, { month: 'short' });
      months.push({ key, label, count: 0 });
    }
    utilisateurs
      .filter((u) => u.role === 'candidat' && u.cree_le)
      .forEach((u) => {
        const d = new Date(u.cree_le!);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const m = months.find((x) => x.key === key);
        if (m) m.count += 1;
      });
    return months;
  }, [utilisateurs]);

  // Top instituts les plus demandés
  const dataTopInstituts = React.useMemo(() => {
    const counter: Record<string, number> = {};
    candidatures.forEach((c: Candidature) => {
      const nom = c.programme?.institut?.nom;
      if (nom) counter[nom] = (counter[nom] ?? 0) + 1;
    });
    return Object.entries(counter)
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [candidatures]);

  // ── Notifications dérivées ──────────────────────────────────
  const { unreadCount: apiNotifCount } = useNotifications();

  const alertes: AdminNotification[] = React.useMemo(() => {
    const out: AdminNotification[] = [];
    const now = Date.now();

    enAttente
      .filter((i) => i.validation_status === 'pending_admin_review')
      .slice(0, 3)
      .forEach((i) => {
        out.push({
          id: `pending-${i.id}`,
          type: 'urgent',
          icon: ShieldAlert,
          title: i18n.t('admin.alerts.validationRequired'),
          description: i18n.t('admin.alerts.validationDesc', {
            name: i.nom ?? i.utilisateur?.email ?? i18n.t('admin.alerts.institutFallback'),
          }),
          date: i.cree_le,
        });
      });

    candidatures
      .filter((c) => c.statut === 'soumise' && c.soumise_le)
      .filter((c) => now - new Date(c.soumise_le!).getTime() < 1000 * 60 * 60 * 24)
      .slice(0, 3)
      .forEach((c) => {
        const candidatNom = [c.candidat?.prenom, c.candidat?.nom].filter(Boolean).join(' ') || i18n.t('admin.alerts.candidatFallback');
        out.push({
          id: `cand-${c.id}`,
          type: 'info',
          icon: FileText,
          title: i18n.t('admin.alerts.newApplication'),
          description: i18n.t('admin.alerts.newApplicationDesc', {
            name: candidatNom,
            program: c.programme?.titre ?? i18n.t('admin.alerts.programFallback'),
          }),
          date: c.soumise_le,
        });
      });

    instituts
      .filter((i) => i.validation_status === 'invited' && i.cree_le)
      .filter((i) => now - new Date(i.cree_le!).getTime() < 1000 * 60 * 60 * 24 * 7)
      .slice(0, 2)
      .forEach((i) => {
        out.push({
          id: `inv-${i.id}`,
          type: 'info',
          icon: Sparkles,
          title: i18n.t('admin.alerts.newInstitut'),
          description: i18n.t('admin.alerts.newInstitutDesc', {
            email: i.utilisateur?.email ?? i18n.t('admin.alerts.etablissementFallback'),
          }),
          date: i.cree_le,
        });
      });

    (programmes as Programme[])
      .filter((p) => p.date_limite_candidature && new Date(p.date_limite_candidature).getTime() < now)
      .slice(0, 2)
      .forEach((p) => {
        out.push({
          id: `exp-${p.id}`,
          type: 'warning',
          icon: AlertTriangle,
          title: i18n.t('admin.alerts.expiredProgram'),
          description: i18n.t('admin.alerts.expiredProgramDesc', { title: p.titre }),
          date: p.date_limite_candidature,
        });
      });

    instituts
      .filter((i) => i.validation_status === 'suspended')
      .slice(0, 2)
      .forEach((i) => {
        out.push({
          id: `susp-${i.id}`,
          type: 'warning',
          icon: ShieldOff,
          title: i18n.t('admin.alerts.suspendedInstitut'),
          description: i18n.t('admin.alerts.suspendedInstitutDesc', {
            name: i.nom ?? i.utilisateur?.email,
          }),
          date: i.suspended_at ?? undefined,
        });
      });

    return out
      .sort((a, b) => {
        const order = { urgent: 0, warning: 1, info: 2 };
        if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      })
      .slice(0, 8);
  }, [enAttente, candidatures, instituts, programmes]);

  const handleApprouver = async (id: string) => {
    setActionLoading(id);
    try {
      await institutService.approuver(id);
      toast.success(t('admin.overview.validation.toasts.approved'));
      chargerEnAttente();
      refetchInsts();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? t('admin.overview.validation.toasts.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendre = async (_id: string) => {
    window.location.href = '/dashboard/admin/instituts';
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
              {t('admin.overview.sectionLabel')}
            </p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">
              {t('admin.overview.greeting', { name: nomAdmin.split(' ')[0] })}
            </h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
              {t('admin.overview.subtitle', {
                date: new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/dashboard/admin/instituts">
                <Building2 className="w-4 h-4 mr-2" />
                {t('admin.overview.manageInstituts')}
              </Link>
            </Button>
            <Button asChild className="rounded-full text-white" style={{ backgroundColor: 'var(--edu-indigo)' }}>
              <Link to="/dashboard/admin/notifications">
                <Bell className="w-4 h-4 mr-2" />
                {t('common.notifications')}
                {apiNotifCount > 0 && (
                  <span className="ml-2 bg-white/20 text-white text-xs rounded-full px-2 py-0.5">
                    {apiNotifCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-[1600px]">
        {/* ── KPI Cards ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <Link
                to={kpi.href}
                className="group block bg-white dark:bg-[#1D1D1F] rounded-2xl p-5 border border-[var(--edu-border)] hover:border-[var(--edu-blue)] hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${kpi.color}15` }}
                  >
                    <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--edu-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-bold text-[var(--edu-text-primary)] tracking-tight">
                  {kpi.loading ? (
                    <span className="inline-block w-12 h-8 bg-[var(--edu-surface)] rounded animate-pulse" />
                  ) : (
                    kpi.value
                  )}
                </p>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-1 leading-snug">
                  {kpi.label}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Section Analytics ────────────────────────────── */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-[var(--edu-text-primary)]">{t('admin.overview.analytics.title')}</h2>
              <p className="text-sm text-[var(--edu-text-secondary)]">
                {t('admin.overview.analytics.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Donut — Répartition par rôle */}
            <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--edu-text-primary)]">{t('admin.overview.analytics.rolesChart')}</h3>
                <span className="text-xs text-[var(--edu-text-tertiary)]">{t('admin.overview.analytics.accounts', { count: utilisateurs.length })}</span>
              </div>
              {dataRoles.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-[var(--edu-text-secondary)]">
                  {t('admin.overview.noData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={dataRoles}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {dataRoles.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--edu-elevated)',
                        border: '1px solid var(--edu-border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar — Candidatures par statut */}
            <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)] lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--edu-text-primary)]">{t('admin.overview.analytics.statusChart')}</h3>
                <span className="text-xs text-[var(--edu-text-tertiary)]">{t('admin.overview.analytics.total', { count: candidatures.length })}</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dataStatuts} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" vertical={false} />
                  <XAxis dataKey="statut" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--edu-surface)' }}
                    contentStyle={{
                      backgroundColor: 'var(--edu-elevated)',
                      border: '1px solid var(--edu-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {dataStatuts.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Line — Croissance mensuelle */}
            <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)] lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--edu-text-primary)]">{t('admin.overview.analytics.growthChart')}</h3>
                <span className="text-xs text-[var(--edu-text-tertiary)]">{t('admin.overview.analytics.growthSubtitle')}</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dataCroissance} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--edu-blue)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--edu-blue)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--edu-elevated)',
                      border: '1px solid var(--edu-border)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--edu-blue)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: 'var(--edu-blue)' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top instituts */}
            <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--edu-text-primary)]">{t('admin.overview.analytics.topInstituts')}</h3>
                <span className="text-xs text-[var(--edu-text-tertiary)]">{t('admin.overview.analytics.topInstitutsBy')}</span>
              </div>
              {dataTopInstituts.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-[var(--edu-text-secondary)]">
                  {t('admin.overview.noData')}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dataTopInstituts} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" horizontal={false} />
                    <XAxis type="number" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="nom" type="category" stroke="var(--edu-text-tertiary)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} width={90} />
                    <Tooltip
                      cursor={{ fill: 'var(--edu-surface)' }}
                      contentStyle={{
                        backgroundColor: 'var(--edu-elevated)',
                        border: '1px solid var(--edu-border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="var(--edu-indigo)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* ── Notifications + Validation rapide ───────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Notifications */}
          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] lg:col-span-2 overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--edu-border)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[var(--edu-text-primary)] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[var(--edu-indigo)]" />
                  {t('admin.overview.notifCenter.title')}
                </h3>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">
                  {t('admin.overview.notifCenter.subtitle')}
                </p>
              </div>
              <Link
                to="/dashboard/admin/notifications"
                className="text-xs font-medium text-[var(--edu-blue)] hover:underline flex items-center gap-1"
              >
                {t('admin.overview.notifCenter.viewAll')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-[var(--edu-divider)] max-h-[420px] overflow-y-auto">
              {alertes.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-[var(--edu-success)]" />
                  <p className="text-sm font-medium text-[var(--edu-text-primary)]">
                    {t('admin.overview.notifCenter.empty')}
                  </p>
                  <p className="text-xs text-[var(--edu-text-secondary)] mt-1">
                    {t('admin.overview.notifCenter.emptySubtitle')}
                  </p>
                </div>
              ) : (
                alertes.map((n) => {
                  const Icon = n.icon;
                  const palette =
                    n.type === 'urgent'
                      ? { bg: 'rgba(255, 59, 48, 0.1)', fg: 'var(--edu-danger)', label: t('admin.overview.palette.urgent') }
                      : n.type === 'warning'
                      ? { bg: 'rgba(255, 159, 10, 0.1)', fg: 'var(--edu-warning)', label: t('admin.overview.palette.warning') }
                      : { bg: 'rgba(0, 113, 227, 0.1)', fg: 'var(--edu-blue)', label: t('admin.overview.palette.info') };
                  return (
                    <div
                      key={n.id}
                      className="px-6 py-4 flex items-start gap-4 hover:bg-[var(--edu-surface)] transition-colors"
                    >
                      <div
                        className="p-2 rounded-xl shrink-0"
                        style={{ backgroundColor: palette.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color: palette.fg }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-[var(--edu-text-primary)] text-sm">{n.title}</p>
                          <span
                            className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: palette.bg, color: palette.fg }}
                          >
                            {palette.label}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5 truncate">
                          {n.description}
                        </p>
                      </div>
                      {n.date && (
                        <span className="text-[11px] text-[var(--edu-text-tertiary)] shrink-0">
                          {formatRelative(n.date)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Validation rapide instituts */}
          <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--edu-border)]">
              <h3 className="font-semibold text-[var(--edu-text-primary)] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[var(--edu-warning)]" />
                {t('admin.overview.validation.title')}
              </h3>
              <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">
                {t('admin.overview.validation.subtitle')}
              </p>
            </div>
            <div className="divide-y divide-[var(--edu-divider)] max-h-[420px] overflow-y-auto">
              {loadingPending ? (
                <div className="px-6 py-8 flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-[var(--edu-blue)] rounded-full animate-spin" />
                </div>
              ) : enAttente.filter((i) => i.validation_status === 'pending_admin_review').length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-[var(--edu-success)]" />
                  <p className="text-xs text-[var(--edu-text-secondary)]">
                    {t('admin.overview.validation.noPending')}
                  </p>
                </div>
              ) : (
                enAttente
                  .filter((i) => i.validation_status === 'pending_admin_review')
                  .slice(0, 5)
                  .map((inst) => (
                    <div key={inst.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[var(--edu-text-primary)] truncate">
                            {inst.nom ?? <span className="italic text-[var(--edu-text-tertiary)]">{t('admin.overview.validation.noName')}</span>}
                          </p>
                          <p className="text-xs text-[var(--edu-text-secondary)] truncate">
                            {inst.utilisateur?.email}
                          </p>
                          <p className="text-[11px] text-[var(--edu-text-tertiary)] mt-0.5">
                            {t('admin.overview.validation.registeredAt', { time: formatRelative(inst.cree_le) })}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 shrink-0">
                          {t('admin.overview.validation.pending')}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          disabled={actionLoading === inst.id}
                          onClick={() => handleApprouver(inst.id)}
                          className="rounded-full text-white text-xs flex-1"
                          style={{ backgroundColor: 'var(--edu-success)' }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('admin.overview.validation.validate')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === inst.id}
                          onClick={() => handleSuspendre(inst.id)}
                          className="rounded-full text-xs flex-1 border-[var(--edu-danger)] text-[var(--edu-danger)]"
                        >
                          <ShieldOff className="w-3 h-3 mr-1" />
                          {t('admin.overview.validation.suspend')}
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <div className="px-5 py-3 border-t border-[var(--edu-border)]">
              <Link
                to="/dashboard/admin/instituts"
                className="text-xs font-medium text-[var(--edu-blue)] hover:underline flex items-center justify-center gap-1"
              >
                {t('admin.overview.validation.manageAll')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
