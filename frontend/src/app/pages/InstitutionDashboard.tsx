import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  FileText,
  Users,
  Clock,
  Send,
  Plus,
  ChevronRight,
  TrendingUp,
  Bell,
  Edit,
  Copy,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useInstitutCandidatures } from '@/hooks/useCandidatures';
import { usePrograms } from '@/hooks/usePrograms';
import { useNotifications } from '@/hooks/useNotifications';
import { useInstitut } from '@/hooks/useInstitut';
import { candidatureService, notificationService } from '@/services/api';
import type { Candidature } from '@/types/api';

// Transitions autorisées pour le rôle institut (backend.md §9.1)
const TRANSITIONS_INSTITUT: Record<string, string[]> = {
  soumise:       ['en_examen', 'acceptee', 'refusee', 'liste_attente'],
  en_examen:     ['acceptee', 'refusee', 'liste_attente'],
  liste_attente: ['acceptee', 'refusee'],
};

// Labels affichés sur les boutons de transition
const TRANSITION_LABELS: Record<string, string> = {
  en_examen:     'En examen',
  acceptee:      'Accepter',
  refusee:       'Refuser',
  liste_attente: 'Attente',
};

// Couleurs des boutons de transition (variables --edu-* ou fallback)
const TRANSITION_COLORS: Record<string, string> = {
  en_examen:     'var(--edu-warning)',
  acceptee:      'var(--edu-success)',
  refusee:       'var(--edu-danger)',
  liste_attente: '#8B5CF6',
};

// Colonnes du kanban
const PIPELINE_COLUMNS = [
  { statut: 'soumise',       title: 'Soumises',       color: 'var(--edu-blue)'    },
  { statut: 'en_examen',     title: 'En examen',      color: 'var(--edu-warning)' },
  { statut: 'liste_attente', title: "Liste d'attente", color: '#8B5CF6'           },
  { statut: 'acceptee',      title: 'Acceptées',      color: 'var(--edu-success)' },
  { statut: 'refusee',       title: 'Refusées',       color: 'var(--edu-danger)'  },
] as const;

export function InstitutionDashboard() {
  const { user } = useAuth();
  // Id du candidat en cours de traitement (évite double-clic)
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { institut } = useInstitut(user?.institut_id);
  const nomInstitut = institut?.nom ?? user?.email ?? 'Institution';

  const {
    programs: programmes,
    loading: loadingProgrammes,
  } = usePrograms({ institut_id: user?.institut_id });

  const {
    candidatures,
    loading: loadingCandidatures,
    refetch: refetchCandidatures,
  } = useInstitutCandidatures();

  const {
    notifications,
    unreadCount,
    loading: loadingNotifications,
    refetch: refetchNotifications,
  } = useNotifications();

  // Stats calculées depuis les vraies données
  const stats = [
    {
      label: 'Programmes publiés',
      value: String(programmes.length),
      icon: FileText,
      color: 'var(--edu-blue)',
    },
    {
      label: 'Nouvelles demandes',
      value: String(candidatures.filter((c) => c.statut === 'soumise').length),
      icon: Users,
      color: 'var(--edu-info)',
    },
    {
      label: 'En examen',
      value: String(candidatures.filter((c) => c.statut === 'en_examen').length),
      icon: Clock,
      color: 'var(--edu-warning)',
    },
    {
      label: 'Décisions rendues',
      value: String(
        candidatures.filter((c) =>
          ['acceptee', 'refusee', 'liste_attente'].includes(c.statut)
        ).length
      ),
      icon: Send,
      color: 'var(--edu-success)',
    },
  ];

  // Regroupement des candidatures par statut pour le kanban
  const pipeline = PIPELINE_COLUMNS.reduce<Record<string, Candidature[]>>(
    (acc, col) => {
      acc[col.statut] = candidatures.filter((c) => c.statut === col.statut);
      return acc;
    },
    {}
  );

  // Nombre de candidatures par programme
  const candidaturesParProgramme = (programmeId: string) =>
    candidatures.filter((c) => c.programme_id === programmeId).length;

  // Données du graphique : candidatures regroupées par mois
  const candidaturesParMois = candidatures.reduce<Record<string, number>>(
    (acc, c) => {
      if (!c.cree_le) return acc;
      const mois = new Date(c.cree_le).toLocaleString('fr-FR', { month: 'short' });
      acc[mois] = (acc[mois] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const dataChart = Object.entries(candidaturesParMois).map(([mois, count]) => ({
    mois,
    candidatures: count,
  }));

  // Changer le statut d'une candidature
  const handleChangerStatut = async (id: string, statut: string) => {
    setProcessingId(id);
    try {
      await candidatureService.changerStatut(id, statut);
      toast.success('Statut mis à jour');
      refetchCandidatures();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        apiErr?.response?.data?.message ?? 'Erreur lors de la mise à jour'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      refetchNotifications();
    } catch {
      // Silencieux
    }
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="institution"
        user={{ name: nomInstitut, role: user?.email ?? 'institut' }}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">
                {nomInstitut} — Dashboard
              </h1>
              <p className="text-[var(--edu-text-secondary)]">{currentDate}</p>
            </div>
            <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
              <Plus className="w-5 h-5 mr-2" />
              Create new program
            </Button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Pipeline Kanban */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Pipeline des candidatures
              </h2>
              <Link to="/dashboard/institution/requests">
                <Button variant="ghost" className="text-[var(--edu-blue)]">
                  Voir tout
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {loadingCandidatures ? (
              /* Squelette kanban */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {PIPELINE_COLUMNS.map((col) => (
                  <div key={col.statut} className="glass-card rounded-2xl p-4">
                    <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse mb-4" />
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-[var(--edu-surface)] rounded-xl animate-pulse mb-3"
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {PIPELINE_COLUMNS.map((col) => {
                  const cards = pipeline[col.statut] ?? [];
                  const transitions = TRANSITIONS_INSTITUT[col.statut] ?? [];

                  return (
                    <div key={col.statut} className="glass-card rounded-2xl p-4">
                      {/* En-tête colonne */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: col.color }}
                          />
                          <h3 className="font-semibold text-[var(--edu-text-primary)] text-sm">
                            {col.title}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-[var(--edu-text-tertiary)] bg-[var(--edu-surface)] px-2 py-1 rounded-full">
                          {cards.length}
                        </span>
                      </div>

                      {/* Cartes candidature */}
                      <div className="space-y-3">
                        {cards.length === 0 ? (
                          <p className="text-xs text-[var(--edu-text-tertiary)] text-center py-4">
                            Aucune
                          </p>
                        ) : (
                          cards.map((c) => {
                            const prenom = c.candidat?.prenom ?? '';
                            const nom = c.candidat?.nom ?? '';
                            const nomComplet =
                              [prenom, nom].filter(Boolean).join(' ') || 'Candidat';
                            const initial = nomComplet.charAt(0).toUpperCase();
                            const dateAffichee = c.soumise_le ?? c.cree_le;

                            return (
                              <div
                                key={c.id}
                                className="bg-white dark:bg-[#1D1D1F] rounded-xl p-3 border border-[var(--edu-border)] hover:shadow-md transition-all"
                              >
                                {/* Identité candidat */}
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                    style={{
                                      background:
                                        'linear-gradient(135deg, var(--edu-blue), #6366F1)',
                                    }}
                                  >
                                    {initial}
                                  </div>
                                  <p className="text-sm font-semibold text-[var(--edu-text-primary)] truncate">
                                    {nomComplet}
                                  </p>
                                </div>

                                {/* Programme */}
                                <p className="text-xs text-[var(--edu-text-secondary)] mb-1 line-clamp-1">
                                  {c.programme?.titre ?? 'Programme'}
                                </p>

                                {/* Date */}
                                <p className="text-xs text-[var(--edu-text-tertiary)] mb-2">
                                  {dateAffichee
                                    ? new Date(dateAffichee).toLocaleDateString()
                                    : '—'}
                                </p>

                                {/* Boutons de transition (non-terminaux seulement) */}
                                {transitions.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {transitions.map((t) => (
                                      <button
                                        key={t}
                                        onClick={() => handleChangerStatut(c.id, t)}
                                        disabled={processingId === c.id}
                                        className="text-xs px-2 py-0.5 rounded-full font-semibold text-white transition-opacity disabled:opacity-50"
                                        style={{
                                          backgroundColor: TRANSITION_COLORS[t],
                                        }}
                                      >
                                        {TRANSITION_LABELS[t]}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Tableau des programmes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                My Programs
              </h2>
              <Link to="/dashboard/institution/programs">
                <Button variant="ghost" className="text-[var(--edu-blue)]">
                  Manage all
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--edu-surface)]">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Titre
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Niveau
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Statut
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Candidatures
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Date limite
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {loadingProgrammes ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : programmes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-[var(--edu-text-secondary)]"
                        >
                          Aucun programme pour le moment.
                        </td>
                      </tr>
                    ) : (
                      programmes.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-[var(--edu-surface)] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-[var(--edu-text-primary)]">
                              {p.titre}
                            </p>
                            {p.domaine && (
                              <p className="text-xs text-[var(--edu-text-tertiary)]">
                                {p.domaine}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[var(--edu-text-secondary)]">
                              {p.niveau ?? '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                color: p.est_actif
                                  ? 'var(--edu-success)'
                                  : 'var(--edu-text-secondary)',
                                backgroundColor: p.est_actif
                                  ? 'var(--edu-success)1A'
                                  : 'var(--edu-surface)',
                              }}
                            >
                              {p.est_actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-[var(--edu-text-primary)]">
                              {candidaturesParProgramme(p.id)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[var(--edu-text-secondary)]">
                              {p.date_limite_candidature
                                ? new Date(
                                    p.date_limite_candidature
                                  ).toLocaleDateString()
                                : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Trend + Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Graphique tendance candidatures */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                  Applications Trend
                </h2>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--edu-success)]">
                  <TrendingUp className="w-4 h-4" />
                  {candidatures.length} total
                </div>
              </div>
              <div className="glass-card rounded-2xl p-6">
                {dataChart.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center text-[var(--edu-text-secondary)]">
                    Pas encore de données.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dataChart}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--edu-divider)"
                      />
                      <XAxis
                        dataKey="mois"
                        stroke="var(--edu-text-tertiary)"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="var(--edu-text-tertiary)"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid var(--edu-border)',
                          borderRadius: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="candidatures"
                        stroke="var(--edu-blue)"
                        strokeWidth={3}
                        dot={{ fill: 'var(--edu-blue)', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Notifications récentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                  Notifications
                  {unreadCount > 0 && (
                    <span
                      className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: 'var(--edu-danger)' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </h2>
              </div>
              <div className="glass-card rounded-2xl p-6 space-y-4">
                {loadingNotifications ? (
                  <p className="text-sm text-[var(--edu-text-secondary)]">
                    Chargement…
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="text-sm text-[var(--edu-text-secondary)]">
                    Aucune notification.
                  </p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                        !n.est_lue ? 'bg-[var(--edu-blue)]/5' : ''
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--edu-blue)15' }}
                      >
                        <Bell className="w-5 h-5 text-[var(--edu-blue)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--edu-text-primary)] mb-1">
                          {n.titre ?? n.type}
                        </p>
                        {n.contenu && (
                          <p className="text-xs text-[var(--edu-text-secondary)] line-clamp-2 mb-1">
                            {n.contenu}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {n.cree_le && (
                            <p className="text-xs text-[var(--edu-text-tertiary)]">
                              {new Date(n.cree_le).toLocaleDateString()}
                            </p>
                          )}
                          {!n.est_lue && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="text-xs text-[var(--edu-blue)] hover:underline ml-auto"
                            >
                              Lue
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
