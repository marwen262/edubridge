import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  FileText, Clock, CheckCircle, FileEdit, Search,
  UserCircle, Upload, Bell, ChevronRight, Inbox, Pencil,
} from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatCard } from '../components/StatCard';
import { ProgramCard } from '../components/ProgramCard';
import { Button } from '../components/ui/button';
import { MultiStepDialog } from '../components/MultiStepDialog';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useCandidatures } from '@/hooks/useCandidatures';
import { useNotifications } from '@/hooks/useNotifications';
import { usePrograms } from '@/hooks/usePrograms';
import { notificationService } from '@/services/api';
import { cn } from '@/app/components/ui/utils';
import {
  getStatutColor,
  getStatutLabel,
  getActionLabel,
} from '@/app/utils/candidatureUtils';
import type { Candidature } from '@/types/api';

export function CandidateDashboard() {
  const { user } = useAuth();
  const [draftToResume, setDraftToResume] = useState<Candidature | null>(null);

  const { candidatures, loading: loadingCandidatures } = useCandidatures();

  const {
    notifications,
    unreadCount,
    loading: loadingNotifications,
    refetch: refetchNotifications,
  } = useNotifications();

  const { programs: programmes } = usePrograms({ est_actif: true });

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      refetchNotifications();
    } catch {
      // Silencieux
    }
  };

  const prenom = user?.prenom ?? user?.email?.split('@')[0] ?? 'Candidat';

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalCandidatures = candidatures.length;
  const enCours = candidatures.filter((c) =>
    ['soumise', 'en_examen', 'liste_attente'].includes(c.statut)
  ).length;
  const acceptees = candidatures.filter((c) => c.statut === 'acceptee').length;
  const brouillons = candidatures.filter((c) => c.statut === 'brouillon').length;

  const stats = [
    { label: 'Total candidatures', value: String(totalCandidatures), icon: FileText, color: 'var(--edu-blue)' },
    { label: 'En cours', value: String(enCours), icon: Clock, color: 'var(--edu-warning)' },
    { label: 'Acceptées', value: String(acceptees), icon: CheckCircle, color: 'var(--edu-success)' },
    { label: 'Brouillons', value: String(brouillons), icon: FileEdit, color: 'var(--edu-text-secondary)' },
  ];

  const recentCandidatures = candidatures.slice(0, 5);

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="candidate"
        user={{ name: prenom, role: user?.role ?? 'candidat' }}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Section A — En-tête */}
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <h1 className="text-2xl font-bold text-[var(--edu-text-primary)]">
            Bonjour, {prenom}
          </h1>
          <p className="text-sm text-[var(--edu-text-secondary)] mt-0.5 capitalize">
            {currentDate}
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Section B — Cartes de stat */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {loadingCandidatures
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                    <div className="w-10 h-10 bg-[var(--edu-surface)] rounded-xl mb-4" />
                    <div className="h-8 w-16 bg-[var(--edu-surface)] rounded mb-2" />
                    <div className="h-4 w-28 bg-[var(--edu-surface)] rounded" />
                  </div>
                ))
              : stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                  >
                    <StatCard {...stat} />
                  </motion.div>
                ))}
          </motion.div>

          {/* Section C — Grille principale 60/40 */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Colonne gauche : candidatures récentes */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="lg:col-span-3"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--edu-text-primary)]">
                  Mes candidatures récentes
                </h2>
                <Link
                  to="/dashboard/candidatures"
                  className="text-sm text-[var(--edu-blue)] hover:underline flex items-center gap-0.5"
                >
                  Voir toutes <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                {loadingCandidatures ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="flex-1 h-4 bg-[var(--edu-surface)] rounded" />
                        <div className="w-28 h-4 bg-[var(--edu-surface)] rounded" />
                        <div className="w-20 h-4 bg-[var(--edu-surface)] rounded" />
                      </div>
                    ))}
                  </div>
                ) : recentCandidatures.length === 0 ? (
                  <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
                    <Inbox className="w-10 h-10 text-[var(--edu-text-tertiary)]" />
                    <p className="text-sm text-[var(--edu-text-secondary)]">
                      Vous n'avez encore aucune candidature.
                    </p>
                    <Link to="/search">
                      <Button
                        size="sm"
                        className="bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white mt-1"
                      >
                        Explorer les programmes
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--edu-surface)]">
                        <tr>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">
                            Programme
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide hidden sm:table-cell">
                            Institut
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide hidden md:table-cell">
                            Date
                          </th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">
                            Statut
                          </th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--edu-divider)]">
                        {recentCandidatures.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-[var(--edu-surface)] transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-medium text-[var(--edu-text-primary)] truncate max-w-[160px]">
                                {c.programme?.titre ?? '—'}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 hidden sm:table-cell">
                              <p className="text-sm text-[var(--edu-text-secondary)] truncate max-w-[140px]">
                                {c.programme?.institut?.nom ?? '—'}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 hidden md:table-cell">
                              <p className="text-sm text-[var(--edu-text-secondary)]">
                                {c.soumise_le
                                  ? new Date(c.soumise_le).toLocaleDateString('fr-FR')
                                  : c.cree_le
                                  ? new Date(c.cree_le).toLocaleDateString('fr-FR')
                                  : '—'}
                              </p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                                style={{
                                  color: getStatutColor(c.statut),
                                  backgroundColor: `${getStatutColor(c.statut)}1A`,
                                }}
                              >
                                {getStatutLabel(c.statut)}
                              </span>
                            </td>
                          <td className="px-5 py-3.5 text-right">
                            {c.statut === 'brouillon' && c.programme ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDraftToResume(c)}
                                className="text-[var(--edu-blue)] text-xs flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                {getActionLabel(c.statut)}
                              </Button>
                            ) : (
                              <Link to={`/program/${c.programme_id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[var(--edu-blue)] text-xs"
                                >
                                  {getActionLabel(c.statut)}
                                </Button>
                              </Link>
                            )}
                          </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Colonne droite : actions rapides + notifications */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              className="lg:col-span-2 space-y-5"
            >
              {/* Actions rapides */}
              <div>
                <h2 className="text-lg font-semibold text-[var(--edu-text-primary)] mb-3">
                  Actions rapides
                </h2>
                <div className="glass-card rounded-2xl p-3 space-y-1">
                  {[
                    { label: 'Explorer les programmes', href: '/search', Icon: Search },
                    { label: 'Compléter mon profil', href: '/dashboard/parametres', Icon: UserCircle },
                    { label: 'Uploader des documents', href: '/dashboard/documents', Icon: Upload },
                  ].map(({ label, href, Icon }) => (
                    <Link
                      key={href}
                      to={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--edu-surface)] transition-colors group"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--edu-blue)15' }}
                      >
                        <Icon className="w-4 h-4" style={{ color: 'var(--edu-blue)' }} />
                      </div>
                      <span className="text-sm font-medium text-[var(--edu-text-primary)] group-hover:text-[var(--edu-blue)] transition-colors flex-1">
                        {label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--edu-text-tertiary)] group-hover:text-[var(--edu-blue)] transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Notifications récentes */}
              <div>
                <h2 className="text-lg font-semibold text-[var(--edu-text-primary)] mb-3 flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: 'var(--edu-danger)' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </h2>
                <div className="glass-card rounded-2xl overflow-hidden divide-y divide-[var(--edu-divider)]">
                  {loadingNotifications ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-[var(--edu-surface)] rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 bg-[var(--edu-surface)] rounded w-3/4" />
                            <div className="h-3 bg-[var(--edu-surface)] rounded w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <Bell className="w-8 h-8 text-[var(--edu-text-tertiary)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--edu-text-secondary)]">
                        Aucune notification pour le moment
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        className={cn('px-4 py-3', !n.est_lue && 'bg-[var(--edu-blue)]/5')}
                      >
                        <div className="flex items-start gap-2.5">
                          {!n.est_lue && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                              style={{ backgroundColor: 'var(--edu-blue)' }}
                            />
                          )}
                          <div className={cn('flex-1 min-w-0', n.est_lue && 'ml-4')}>
                            <p className="text-sm font-medium text-[var(--edu-text-primary)] leading-snug">
                              {n.titre ?? n.type}
                            </p>
                            {n.contenu && (
                              <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5 line-clamp-2">
                                {n.contenu}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              {n.cree_le && (
                                <span className="text-[11px] text-[var(--edu-text-tertiary)]">
                                  {new Date(n.cree_le).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                              {!n.est_lue && (
                                <button
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="text-[11px] text-[var(--edu-blue)] hover:underline"
                                >
                                  Marquer lue
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Section D — Découvrir des programmes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--edu-text-primary)]">
                  Découvrir des programmes
                </h2>
                <p className="text-sm text-[var(--edu-text-secondary)] mt-0.5">
                  Explorez les formations disponibles sur EduBridge
                </p>
              </div>
              <Link
                to="/search"
                className="text-sm text-[var(--edu-blue)] hover:underline flex items-center gap-0.5"
              >
                Voir tous <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {programmes.slice(0, 3).map((programme) => (
                <ProgramCard key={programme.id} programme={programme} view="grid" />
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Dialogue de reprise de brouillon */}
      {draftToResume && draftToResume.programme && (
        <MultiStepDialog
          open={!!draftToResume}
          onOpenChange={(open) => { if (!open) setDraftToResume(null); }}
          programme={draftToResume.programme}
          candidatureId={draftToResume.id}
          lettreMotivationInitiale={draftToResume.lettre_motivation}
          documentsExistants={draftToResume.documents_soumis}
        />
      )}
    </div>
  );
}
