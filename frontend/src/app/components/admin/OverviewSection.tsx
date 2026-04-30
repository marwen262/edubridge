import React from 'react';
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
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString('fr-FR');
}

export function OverviewSection({ nomAdmin }: OverviewSectionProps) {
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
      label: 'Utilisateurs',
      value: utilisateurs.length,
      icon: Users,
      color: 'var(--edu-indigo)',
      loading: loadingUsers,
      href: '/dashboard/admin/utilisateurs',
    },
    {
      label: 'Instituts',
      value: totalInstituts,
      icon: Building2,
      color: 'var(--edu-blue)',
      loading: loadingUsers,
      href: '/dashboard/admin/instituts',
    },
    {
      label: 'Programmes',
      value: programmes.length,
      icon: FileText,
      color: 'var(--edu-info)',
      loading: loadingProgs,
      href: '/dashboard/admin/programmes',
    },
    {
      label: 'Candidatures en attente',
      value: candidaturesEnAttente,
      icon: Clock,
      color: 'var(--edu-warning)',
      loading: loadingCands,
      href: '/dashboard/admin/candidatures',
    },
    {
      label: 'Instituts non vérifiés',
      value: institutsNonVerifies,
      icon: ShieldAlert,
      color: 'var(--edu-danger)',
      loading: loadingInsts,
      href: '/dashboard/admin/instituts',
    },
    {
      label: "Taux d'acceptation",
      value: `${tauxAcceptation}%`,
      icon: TrendingUp,
      color: 'var(--edu-success)',
      loading: loadingCands,
      href: '/dashboard/admin/candidatures',
    },
  ];

  // ── Données graphiques ──────────────────────────────────────
  const dataRoles = [
    { name: 'Candidats', value: totalCandidats },
    { name: 'Instituts', value: totalInstituts },
    { name: 'Admins', value: totalAdmins },
  ].filter((d) => d.value > 0);

  const dataStatuts = [
    { statut: 'Soumises', count: candidatures.filter((c) => c.statut === 'soumise').length, fill: 'var(--edu-blue)' },
    { statut: 'En examen', count: candidatures.filter((c) => c.statut === 'en_examen').length, fill: 'var(--edu-warning)' },
    { statut: 'Acceptées', count: candidatures.filter((c) => c.statut === 'acceptee').length, fill: 'var(--edu-success)' },
    { statut: 'Refusées', count: candidatures.filter((c) => c.statut === 'refusee').length, fill: 'var(--edu-danger)' },
    { statut: "Liste d'attente", count: candidatures.filter((c) => c.statut === 'liste_attente').length, fill: '#8B5CF6' },
  ];

  // Croissance mensuelle (12 derniers mois) sur la base de cree_le des candidats
  const dataCroissance = React.useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
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

  // Top instituts les plus demandés (par nombre de candidatures)
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

    // 1. Instituts en attente de validation
    enAttente
      .filter((i) => i.validation_status === 'pending_admin_review')
      .slice(0, 3)
      .forEach((i) => {
        out.push({
          id: `pending-${i.id}`,
          type: 'urgent',
          icon: ShieldAlert,
          title: 'Validation requise',
          description: `${i.nom ?? i.utilisateur?.email ?? 'Institut'} attend une validation administrateur.`,
          date: i.cree_le,
        });
      });

    // 2. Nouvelle candidature soumise (< 24h)
    candidatures
      .filter((c) => c.statut === 'soumise' && c.soumise_le)
      .filter((c) => now - new Date(c.soumise_le!).getTime() < 1000 * 60 * 60 * 24)
      .slice(0, 3)
      .forEach((c) => {
        const candidatNom = [c.candidat?.prenom, c.candidat?.nom].filter(Boolean).join(' ') || 'Un candidat';
        out.push({
          id: `cand-${c.id}`,
          type: 'info',
          icon: FileText,
          title: 'Nouvelle candidature soumise',
          description: `${candidatNom} a postulé à ${c.programme?.titre ?? 'un programme'}.`,
          date: c.soumise_le,
        });
      });

    // 3. Nouvel institut inscrit (< 7j, statut invited)
    instituts
      .filter((i) => i.validation_status === 'invited' && i.cree_le)
      .filter((i) => now - new Date(i.cree_le!).getTime() < 1000 * 60 * 60 * 24 * 7)
      .slice(0, 2)
      .forEach((i) => {
        out.push({
          id: `inv-${i.id}`,
          type: 'info',
          icon: Sparkles,
          title: 'Nouvel institut invité',
          description: `${i.utilisateur?.email ?? 'Un établissement'} doit finaliser son inscription.`,
          date: i.cree_le,
        });
      });

    // 4. Programmes expirés
    (programmes as Programme[])
      .filter((p) => p.date_limite_candidature && new Date(p.date_limite_candidature).getTime() < now)
      .slice(0, 2)
      .forEach((p) => {
        out.push({
          id: `exp-${p.id}`,
          type: 'warning',
          icon: AlertTriangle,
          title: 'Programme expiré',
          description: `${p.titre} — date limite dépassée.`,
          date: p.date_limite_candidature,
        });
      });

    // 5. Comptes suspendus
    instituts
      .filter((i) => i.validation_status === 'suspended')
      .slice(0, 2)
      .forEach((i) => {
        out.push({
          id: `susp-${i.id}`,
          type: 'warning',
          icon: ShieldOff,
          title: 'Institut suspendu',
          description: `${i.nom ?? i.utilisateur?.email} — accès suspendu.`,
          date: i.suspended_at ?? undefined,
        });
      });

    // Trier : urgents en premier, puis par date
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
      toast.success('Institut approuvé.');
      chargerEnAttente();
      refetchInsts();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Erreur');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendre = async (_id: string) => {
    // Rediriger vers la page Instituts pour utiliser le dialog de suspension complet
    window.location.href = '/dashboard/admin/instituts';
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
              Tableau de bord administrateur
            </p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">
              Bonjour, {nomAdmin.split(' ')[0]}
            </h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
              Vue d'ensemble de la plateforme — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/dashboard/admin/instituts">
                <Building2 className="w-4 h-4 mr-2" />
                Gérer les instituts
              </Link>
            </Button>
            <Button asChild className="rounded-full text-white" style={{ backgroundColor: 'var(--edu-indigo)' }}>
              <Link to="/dashboard/admin/notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
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
              <h2 className="text-xl font-bold text-[var(--edu-text-primary)]">Analytics</h2>
              <p className="text-sm text-[var(--edu-text-secondary)]">
                Indicateurs clés de l'activité plateforme
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Donut — Répartition par rôle */}
            <div className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-6 border border-[var(--edu-border)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--edu-text-primary)]">Répartition par rôle</h3>
                <span className="text-xs text-[var(--edu-text-tertiary)]">{utilisateurs.length} comptes</span>
              </div>
              {dataRoles.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-[var(--edu-text-secondary)]">
                  Pas de données
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
                <h3 className="font-semibold text-[var(--edu-text-primary)]">Candidatures par statut</h3>
                <span className="text-xs text-[var(--edu-text-tertiary)]">{candidatures.length} au total</span>
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
                <h3 className="font-semibold text-[var(--edu-text-primary)]">Croissance mensuelle des inscriptions</h3>
                <span className="text-xs text-[var(--edu-text-tertiary)]">12 derniers mois · candidats</span>
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
                <h3 className="font-semibold text-[var(--edu-text-primary)]">Top instituts demandés</h3>
                <span className="text-xs text-[var(--edu-text-tertiary)]">par candidatures</span>
              </div>
              {dataTopInstituts.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-sm text-[var(--edu-text-secondary)]">
                  Pas de données
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
                  Centre de notifications
                </h3>
                <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">
                  Événements importants nécessitant votre attention
                </p>
              </div>
              <Link
                to="/dashboard/admin/notifications"
                className="text-xs font-medium text-[var(--edu-blue)] hover:underline flex items-center gap-1"
              >
                Tout voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-[var(--edu-divider)] max-h-[420px] overflow-y-auto">
              {alertes.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-[var(--edu-success)]" />
                  <p className="text-sm font-medium text-[var(--edu-text-primary)]">
                    Tout est à jour
                  </p>
                  <p className="text-xs text-[var(--edu-text-secondary)] mt-1">
                    Aucune notification urgente pour le moment.
                  </p>
                </div>
              ) : (
                alertes.map((n) => {
                  const Icon = n.icon;
                  const palette =
                    n.type === 'urgent'
                      ? { bg: 'rgba(255, 59, 48, 0.1)', fg: 'var(--edu-danger)', label: 'Urgent' }
                      : n.type === 'warning'
                      ? { bg: 'rgba(255, 159, 10, 0.1)', fg: 'var(--edu-warning)', label: 'Important' }
                      : { bg: 'rgba(0, 113, 227, 0.1)', fg: 'var(--edu-blue)', label: 'Info' };
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
                Validation des instituts
              </h3>
              <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">
                Établissements en attente de revue
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
                    Aucun établissement en attente.
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
                            {inst.nom ?? <span className="italic text-[var(--edu-text-tertiary)]">Sans nom</span>}
                          </p>
                          <p className="text-xs text-[var(--edu-text-secondary)] truncate">
                            {inst.utilisateur?.email}
                          </p>
                          <p className="text-[11px] text-[var(--edu-text-tertiary)] mt-0.5">
                            Inscrit {formatRelative(inst.cree_le)}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 shrink-0">
                          En attente
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
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === inst.id}
                          onClick={() => handleSuspendre(inst.id)}
                          className="rounded-full text-xs flex-1 border-[var(--edu-danger)] text-[var(--edu-danger)]"
                        >
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Suspendre
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
                Gérer tous les instituts <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
