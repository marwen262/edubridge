import React from 'react';
import { Link } from 'react-router';
import {
  FileText,
  Clock,
  CheckCircle,
  Heart,
  Upload,
  Bell,
  Calendar,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatCard } from '../components/StatCard';
import { ProgramCard } from '../components/ProgramCard';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useCandidatures } from '@/hooks/useCandidatures';
import { useFavoris, useToggleFavori } from '@/hooks/useFavoris';
import { useNotifications } from '@/hooks/useNotifications';
import { usePrograms } from '@/hooks/usePrograms';
import { notificationService } from '@/services/api';
import type { Candidature } from '@/types/api';

// Couleur CSS selon le statut backend
function getStatutColor(statut: Candidature['statut']): string {
  switch (statut) {
    case 'brouillon':     return 'var(--edu-text-secondary)';
    case 'soumise':       return 'var(--edu-blue)';
    case 'en_examen':     return 'var(--edu-warning)';
    case 'acceptee':      return 'var(--edu-success)';
    case 'refusee':       return 'var(--edu-danger)';
    case 'liste_attente': return '#8B5CF6';
    default:              return 'var(--edu-text-secondary)';
  }
}

// Label lisible pour un statut backend
function getStatutLabel(statut: Candidature['statut']): string {
  switch (statut) {
    case 'brouillon':     return 'Brouillon';
    case 'soumise':       return 'Soumise';
    case 'en_examen':     return 'En examen';
    case 'acceptee':      return 'Acceptée';
    case 'refusee':       return 'Refusée';
    case 'liste_attente': return "Liste d'attente";
    default:              return statut;
  }
}

// Nombre de jours restants jusqu'à une date
function getDaysLeft(dateStr: string): number {
  const now = new Date();
  const deadline = new Date(dateStr);
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function CandidateDashboard() {
  const { user } = useAuth();

  const {
    candidatures,
    loading: loadingCandidatures,
    refetch: refetchCandidatures,
  } = useCandidatures();

  const {
    favoris,
    loading: loadingFavoris,
    refetch: refetchFavoris,
  } = useFavoris();
  const { toggle: toggleFavori, loading: togglingFavori } = useToggleFavori();

  // Retirer un programme des favoris
  const handleRetirerFavori = async (programmeId: string) => {
    try {
      await toggleFavori(programmeId);
      toast.success('Retiré des favoris');
      refetchFavoris();
    } catch {
      toast.error('Erreur lors du retrait du favori');
    }
  };

  const {
    notifications,
    unreadCount,
    loading: loadingNotifications,
    refetch: refetchNotifications,
  } = useNotifications();

  const { programs: programmesRecommandes } = usePrograms({ est_actif: true });

  // Stats calculées dynamiquement depuis les vraies données
  const stats = [
    {
      label: 'Candidatures',
      value: String(candidatures.length),
      icon: FileText,
    },
    {
      label: 'En examen',
      value: String(candidatures.filter((c) => c.statut === 'en_examen').length),
      icon: Clock,
    },
    {
      label: 'Acceptées',
      value: String(candidatures.filter((c) => c.statut === 'acceptee').length),
      icon: CheckCircle,
    },
    {
      label: 'Favoris',
      value: String(favoris.length),
      icon: Heart,
    },
  ];

  // Deadlines des candidatures non terminales, triées par date croissante
  const deadlines = candidatures
    .filter(
      (c) =>
        !['acceptee', 'refusee'].includes(c.statut) &&
        c.programme?.date_limite_candidature
    )
    .sort(
      (a, b) =>
        new Date(a.programme!.date_limite_candidature!).getTime() -
        new Date(b.programme!.date_limite_candidature!).getTime()
    )
    .slice(0, 3);

  // Marquer une notification comme lue et recharger
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      refetchNotifications();
    } catch {
      // Silencieux — l'UI se mettra à jour au prochain refetch
    }
  };

  const prenom = user?.prenom ?? user?.email?.split('@')[0] ?? 'Candidat';

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="candidate"
        user={{ name: prenom, role: user?.role ?? 'candidat' }}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">
                Bonjour, {prenom} 👋
              </h1>
              <p className="text-[var(--edu-text-secondary)]">{currentDate}</p>
            </div>
            <Link to="/search">
              <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                <Search className="w-5 h-5 mr-2" />
                Explore Programs
              </Button>
            </Link>
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

          {/* Mes candidatures */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                My Applications
              </h2>
              <Link to="/dashboard/candidate/applications">
                <Button variant="ghost" className="text-[var(--edu-blue)]">
                  View all
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
                        Program
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Institution
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Submitted
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Status
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {loadingCandidatures ? (
                      // Squelette de chargement
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : candidatures.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-[var(--edu-text-secondary)]"
                        >
                          Aucune candidature pour le moment.
                        </td>
                      </tr>
                    ) : (
                      candidatures.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-[var(--edu-surface)] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-[var(--edu-text-primary)]">
                              {c.programme?.titre ?? 'Programme inconnu'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[var(--edu-text-secondary)]">
                              {c.programme?.institut?.nom ?? ''}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[var(--edu-text-secondary)]">
                              {c.soumise_le
                                ? new Date(c.soumise_le).toLocaleDateString()
                                : c.cree_le
                                ? new Date(c.cree_le).toLocaleDateString()
                                : '—'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{
                                color: getStatutColor(c.statut),
                                backgroundColor: `${getStatutColor(c.statut)}1A`,
                              }}
                            >
                              {getStatutLabel(c.statut)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[var(--edu-blue)]"
                            >
                              View details
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Deux colonnes : Deadlines + Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">
                Upcoming Deadlines
              </h2>
              <div className="glass-card rounded-2xl p-6 space-y-4">
                {deadlines.length === 0 ? (
                  <p className="text-sm text-[var(--edu-text-secondary)]">
                    Aucune échéance à venir.
                  </p>
                ) : (
                  deadlines.map((c) => {
                    const daysLeft = getDaysLeft(
                      c.programme!.date_limite_candidature!
                    );
                    return (
                      <div key={c.id} className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--edu-warning)15' }}
                        >
                          <Calendar className="w-6 h-6 text-[var(--edu-warning)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--edu-text-primary)] mb-1">
                            {c.programme!.titre}
                          </p>
                          <p className="text-sm text-[var(--edu-text-secondary)] mb-2">
                            {c.programme!.institut?.nom ?? ''}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className="font-semibold"
                              style={{
                                color:
                                  daysLeft <= 7
                                    ? 'var(--edu-danger)'
                                    : 'var(--edu-warning)',
                              }}
                            >
                              {daysLeft > 0
                                ? `${daysLeft} days left`
                                : 'Expired'}
                            </span>
                            <span className="text-[var(--edu-text-tertiary)]">
                              •
                            </span>
                            <span className="text-[var(--edu-text-tertiary)]">
                              {new Date(
                                c.programme!.date_limite_candidature!
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Notifications récentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
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
                      className={`p-4 rounded-xl transition-colors ${
                        !n.est_lue ? 'bg-[var(--edu-blue)]/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: 'var(--edu-blue)' }}
                        >
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-semibold text-[var(--edu-text-primary)]">
                              {n.titre ?? n.type}
                            </p>
                            {n.cree_le && (
                              <span className="text-xs text-[var(--edu-text-tertiary)] ml-2 flex-shrink-0">
                                {new Date(n.cree_le).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {n.contenu && (
                            <p className="text-sm text-[var(--edu-text-secondary)] line-clamp-2">
                              {n.contenu}
                            </p>
                          )}
                          {!n.est_lue && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="mt-2 text-xs text-[var(--edu-blue)] hover:underline"
                            >
                              Marquer comme lue
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

          {/* Mes favoris */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Mes favoris
              </h2>
            </div>
            <div className="glass-card rounded-2xl p-6">
              {loadingFavoris ? (
                <p className="text-sm text-[var(--edu-text-secondary)]">
                  Chargement…
                </p>
              ) : favoris.length === 0 ? (
                <p className="text-sm text-[var(--edu-text-secondary)]">
                  Aucun favori enregistré.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoris.slice(0, 4).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-[var(--edu-surface)]"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--edu-danger)1A' }}
                      >
                        <Heart
                          className="w-5 h-5"
                          style={{ color: 'var(--edu-danger)' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--edu-text-primary)] truncate">
                          {f.programme?.titre ?? 'Programme'}
                        </p>
                        <p className="text-sm text-[var(--edu-text-secondary)] truncate">
                          {f.programme?.institut?.nom ?? ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {f.programme?.id && (
                          <Link to={`/program/${f.programme.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[var(--edu-blue)]"
                              aria-label="Voir le programme"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetirerFavori(f.programme_id)}
                          disabled={togglingFavori}
                          className="text-[var(--edu-text-secondary)] hover:text-[var(--edu-danger)]"
                          aria-label="Retirer des favoris"
                          title="Retirer des favoris"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Programmes recommandés */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">
              Recommended for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {programmesRecommandes.slice(0, 3).map((program) => (
                <ProgramCard key={program.id} program={program} view="grid" />
              ))}
            </div>
          </motion.div>

          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Documents
              </h2>
              <Link to="/dashboard/candidate/documents">
                <Button variant="ghost" className="text-[var(--edu-blue)]">
                  Manage
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Baccalauréat',
                  status: 'Verified',
                  color: 'var(--edu-success)',
                },
                {
                  name: 'Transcripts',
                  status: 'Pending',
                  color: 'var(--edu-warning)',
                },
                {
                  name: 'ID Copy',
                  status: 'Verified',
                  color: 'var(--edu-success)',
                },
              ].map((doc, i) => (
                <div key={i} className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--edu-surface)] flex items-center justify-center">
                      <Upload className="w-6 h-6 text-[var(--edu-text-secondary)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--edu-text-primary)] mb-1">
                        {doc.name}
                      </p>
                      <p className="text-sm" style={{ color: doc.color }}>
                        {doc.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
