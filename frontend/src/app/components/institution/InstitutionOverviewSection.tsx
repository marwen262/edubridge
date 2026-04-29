import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  FileText, Users, Clock, Send, Plus, ChevronRight, TrendingUp,
  Clock3, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Bell,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { StatCard } from '../StatCard';
import { Button } from '../ui/button';
import { CreateProgramDialog } from './CreateProgramDialog';
import { motion } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useInstitutCandidatures } from '@/hooks/useCandidatures';
import { usePrograms } from '@/hooks/usePrograms';
import { useNotifications } from '@/hooks/useNotifications';
import { candidatureService, notificationService, institutService } from '@/services/api';
import type { Candidature, Institut, ValidationStatus } from '@/types/api';

const TRANSITIONS_INSTITUT: Record<string, string[]> = {
  soumise: ['en_examen', 'acceptee', 'refusee', 'liste_attente'],
  en_examen: ['acceptee', 'refusee', 'liste_attente'],
  liste_attente: ['acceptee', 'refusee'],
};
const TRANSITION_LABELS: Record<string, string> = {
  en_examen: 'En examen', acceptee: 'Accepter', refusee: 'Refuser', liste_attente: 'Attente',
};
const TRANSITION_COLORS: Record<string, string> = {
  en_examen: 'var(--edu-warning)', acceptee: 'var(--edu-success)', refusee: 'var(--edu-danger)', liste_attente: '#8B5CF6',
};
const PIPELINE_COLUMNS = [
  { statut: 'soumise', title: 'Soumises', color: 'var(--edu-blue)' },
  { statut: 'en_examen', title: 'En examen', color: 'var(--edu-warning)' },
  { statut: 'liste_attente', title: "Liste d'attente", color: '#8B5CF6' },
  { statut: 'acceptee', title: 'Acceptées', color: 'var(--edu-success)' },
  { statut: 'refusee', title: 'Refusées', color: 'var(--edu-danger)' },
] as const;

function ValidationBanner({ status, reason, onResoumettre }: { status: ValidationStatus; reason?: string | null; onResoumettre?: () => void }) {
  const configs: Record<string, { icon: React.ReactNode; bg: string; border: string; title: string; message: string }> = {
    pending_admin_review: { icon: <Clock3 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />, bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800', title: 'Statut de votre établissement', message: "Votre établissement est en attente de validation administrateur." },
    approved: { icon: <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />, bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800', title: 'Statut de votre établissement', message: "Votre établissement est approuvé et actif sur la plateforme." },
    suspended: { icon: <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />, bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', title: 'Statut de votre établissement', message: "Votre compte établissement est suspendu." },
    invited: { icon: <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />, bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800', title: 'Statut de votre établissement', message: "Veuillez finaliser votre inscription." },
    rejected: { icon: <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />, bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800', title: 'Statut de votre établissement', message: reason ?? 'Votre dossier a été rejeté. Veuillez corriger et resoumettre.' },
  };
  const cfg = configs[status];
  if (!cfg) return null;
  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--edu-text-primary)]">{cfg.title}</p>
        <p className="text-xs text-[var(--edu-text-secondary)] mt-1 leading-relaxed">{cfg.message}</p>
      </div>
      {status === 'rejected' && onResoumettre && (
        <button onClick={onResoumettre} className="text-xs font-semibold text-[var(--edu-blue)] hover:underline shrink-0 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Resoumettre
        </button>
      )}
    </div>
  );
}

interface Props { institut: Institut | null; }

export function InstitutionOverviewSection({ institut }: Props) {
  const { user } = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const nomInstitut = institut?.nom ?? user?.email ?? 'Institution';
  const validationStatus = (institut?.validation_status ?? user?.validation_status) as ValidationStatus | undefined;

  const handleResoumettre = async () => {
    if (!user?.institut_id) return;
    try {
      await institutService.resoumettre(user.institut_id);
      toast.success('Dossier resoumis pour validation.');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message ?? 'Erreur');
    }
  };

  const { programs: programmes, loading: loadingProgrammes, refetch: refetchProgrammes } = usePrograms({ institut_id: user?.institut_id });
  const { candidatures, loading: loadingCandidatures, refetch: refetchCandidatures } = useInstitutCandidatures();
  const { notifications, unreadCount, loading: loadingNotifications, refetch: refetchNotifications } = useNotifications();

  const stats = [
    { label: 'Programmes publiés', value: String(programmes.length), icon: FileText, color: 'var(--edu-blue)' },
    { label: 'Nouvelles demandes', value: String(candidatures.filter((c) => c.statut === 'soumise').length), icon: Users, color: 'var(--edu-info)' },
    { label: 'En examen', value: String(candidatures.filter((c) => c.statut === 'en_examen').length), icon: Clock, color: 'var(--edu-warning)' },
    { label: 'Décisions rendues', value: String(candidatures.filter((c) => ['acceptee', 'refusee', 'liste_attente'].includes(c.statut)).length), icon: Send, color: 'var(--edu-success)' },
  ];

  const pipeline = PIPELINE_COLUMNS.reduce<Record<string, Candidature[]>>((acc, col) => {
    acc[col.statut] = candidatures.filter((c) => c.statut === col.statut);
    return acc;
  }, {});

  const candidaturesParMois = candidatures.reduce<Record<string, number>>((acc, c) => {
    if (!c.cree_le) return acc;
    const mois = new Date(c.cree_le).toLocaleString('fr-FR', { month: 'short' });
    acc[mois] = (acc[mois] ?? 0) + 1;
    return acc;
  }, {});
  const dataChart = Object.entries(candidaturesParMois).map(([mois, count]) => ({ mois, candidatures: count }));

  const handleChangerStatut = async (id: string, statut: string) => {
    setProcessingId(id);
    try {
      await candidatureService.changerStatut(id, statut);
      toast.success('Statut mis à jour');
      refetchCandidatures();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Erreur');
    } finally { setProcessingId(null); }
  };

  const handleMarkAsRead = async (id: string) => {
    try { await notificationService.markAsRead(id); refetchNotifications(); } catch { /* silent */ }
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">Tableau de bord</p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">{nomInstitut}</h1>
            <p className="text-[var(--edu-text-secondary)]">{currentDate}</p>
          </div>
          <Button
            onClick={() => {
              if (validationStatus && validationStatus !== 'approved') {
                toast.error("Votre établissement doit être validé par l'administrateur avant de pouvoir publier des programmes.");
                return;
              }
              setShowCreateDialog(true);
            }}
            className={`rounded-full text-white ${validationStatus && validationStatus !== 'approved' ? 'opacity-50 hover:opacity-50 cursor-not-allowed' : 'hover:bg-[var(--edu-blue-hover)]'}`}
            style={{ backgroundColor: validationStatus && validationStatus !== 'approved' ? 'var(--edu-text-tertiary)' : 'var(--edu-blue)' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer un programme
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {validationStatus && (
          <ValidationBanner status={validationStatus} reason={institut?.suspension_reason} onResoumettre={validationStatus === 'rejected' ? handleResoumettre : undefined} />
        )}

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pipeline Kanban */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">Pipeline des candidatures</h2>
            <Link to="/dashboard/institution/candidatures">
              <Button variant="ghost" className="text-[var(--edu-blue)]">Voir tout<ChevronRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
          {loadingCandidatures ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {PIPELINE_COLUMNS.map((col) => (
                <div key={col.statut} className="glass-card rounded-2xl p-4">
                  <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse mb-4" />
                  {[1, 2].map((i) => <div key={i} className="h-20 bg-[var(--edu-surface)] rounded-xl animate-pulse mb-3" />)}
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                        <h3 className="font-semibold text-[var(--edu-text-primary)] text-sm">{col.title}</h3>
                      </div>
                      <span className="text-xs font-semibold text-[var(--edu-text-tertiary)] bg-[var(--edu-surface)] px-2 py-1 rounded-full">{cards.length}</span>
                    </div>
                    <div className="space-y-3">
                      {cards.length === 0 ? (
                        <p className="text-xs text-[var(--edu-text-tertiary)] text-center py-4">Aucune</p>
                      ) : cards.map((c) => {
                        const nomComplet = [c.candidat?.prenom, c.candidat?.nom].filter(Boolean).join(' ') || 'Candidat';
                        return (
                          <div key={c.id} className="bg-white dark:bg-[#1D1D1F] rounded-xl p-3 border border-[var(--edu-border)] hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--edu-blue), #6366F1)' }}>
                                {nomComplet.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-sm font-semibold text-[var(--edu-text-primary)] truncate">{nomComplet}</p>
                            </div>
                            <p className="text-xs text-[var(--edu-text-secondary)] mb-1 line-clamp-1">{c.programme?.titre ?? 'Programme'}</p>
                            <p className="text-xs text-[var(--edu-text-tertiary)] mb-2">{(c.soumise_le ?? c.cree_le) ? new Date((c.soumise_le ?? c.cree_le)!).toLocaleDateString() : '—'}</p>
                            {transitions.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {transitions.map((t) => (
                                  <button key={t} onClick={() => handleChangerStatut(c.id, t)} disabled={processingId === c.id}
                                    className="text-xs px-2 py-0.5 rounded-full font-semibold text-white transition-opacity disabled:opacity-50"
                                    style={{ backgroundColor: TRANSITION_COLORS[t] }}>{TRANSITION_LABELS[t]}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Trend + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">Tendance des candidatures</h2>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--edu-success)]">
                <TrendingUp className="w-4 h-4" />{candidatures.length} total
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              {dataChart.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-[var(--edu-text-secondary)]">Pas encore de données.</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dataChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" />
                    <XAxis dataKey="mois" stroke="var(--edu-text-tertiary)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--edu-text-tertiary)" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--edu-border)', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="candidatures" stroke="var(--edu-blue)" strokeWidth={3} dot={{ fill: 'var(--edu-blue)', r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Notifications
                {unreadCount > 0 && <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: 'var(--edu-danger)' }}>{unreadCount}</span>}
              </h2>
            </div>
            <div className="glass-card rounded-2xl p-6 space-y-4">
              {loadingNotifications ? (
                <p className="text-sm text-[var(--edu-text-secondary)]">Chargement…</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-[var(--edu-text-secondary)]">Aucune notification.</p>
              ) : notifications.slice(0, 5).map((n) => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${!n.est_lue ? 'bg-[var(--edu-blue)]/5' : ''}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--edu-blue)15' }}>
                    <Bell className="w-5 h-5 text-[var(--edu-blue)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--edu-text-primary)] mb-1">{n.titre ?? n.type}</p>
                    {n.contenu && <p className="text-xs text-[var(--edu-text-secondary)] line-clamp-2 mb-1">{n.contenu}</p>}
                    <div className="flex items-center justify-between">
                      {n.cree_le && <p className="text-xs text-[var(--edu-text-tertiary)]">{new Date(n.cree_le).toLocaleDateString()}</p>}
                      {!n.est_lue && <button onClick={() => handleMarkAsRead(n.id)} className="text-xs text-[var(--edu-blue)] hover:underline ml-auto">Lue</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create Program Dialog */}
      {user?.institut_id && (
        <CreateProgramDialog
          institutId={user.institut_id}
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreated={refetchProgrammes}
        />
      )}
    </div>
  );
}
