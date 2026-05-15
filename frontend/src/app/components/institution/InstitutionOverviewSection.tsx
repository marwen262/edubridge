import React, { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  FileText, Users, Clock, Send, Plus, ChevronRight, TrendingUp,
  Clock3, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Bell, Phone,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../ui/dialog';
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
import i18n from '@/i18n';
import type { Candidature, Institut, ValidationStatus } from '@/types/api';

const TRANSITIONS_INSTITUT: Record<string, string[]> = {
  soumise: ['en_examen', 'acceptee', 'refusee', 'liste_attente'],
  en_examen: ['acceptee', 'refusee', 'liste_attente'],
  liste_attente: ['acceptee', 'refusee'],
};
const TRANSITION_COLORS: Record<string, string> = {
  en_examen: 'var(--edu-warning)', acceptee: 'var(--edu-success)', refusee: 'var(--edu-danger)', liste_attente: '#8B5CF6',
};
const PIPELINE_COLUMNS = [
  { statut: 'soumise', color: 'var(--edu-blue)' },
  { statut: 'en_examen', color: 'var(--edu-warning)' },
  { statut: 'liste_attente', color: '#8B5CF6' },
  { statut: 'acceptee', color: 'var(--edu-success)' },
  { statut: 'refusee', color: 'var(--edu-danger)' },
] as const;

function ValidationBanner({ status, reason, onResoumettre }: { status: ValidationStatus; reason?: string | null; onResoumettre?: () => void }) {
  const { t } = useTranslation();
  const configs: Record<string, { icon: React.ReactNode; bg: string; border: string }> = {
    pending_admin_review: { icon: <Clock3 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />, bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800' },
    approved: { icon: <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />, bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800' },
    suspended: { icon: <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />, bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800' },
    invited: { icon: <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />, bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800' },
    rejected: { icon: <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />, bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800' },
  };
  const cfg = configs[status];
  if (!cfg) return null;
  const message = status === 'rejected' ? (reason ?? t('status.rejected')) : t(`status.${status}`);
  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[var(--edu-text-primary)]">{t('status.institutionStatus')}</p>
        <p className="text-xs text-[var(--edu-text-secondary)] mt-1 leading-relaxed">{message}</p>
      </div>
      {status === 'rejected' && onResoumettre && (
        <button onClick={onResoumettre} className="text-xs font-semibold text-[var(--edu-blue)] hover:underline shrink-0 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> {t('status.resubmit')}
        </button>
      )}
    </div>
  );
}

interface Props { institut: Institut | null; }

export function InstitutionOverviewSection({ institut }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCandidat, setSelectedCandidat] = useState<Candidature | null>(null);

  const nomInstitut = institut?.nom ?? user?.email ?? 'Institution';
  const validationStatus = (institut?.validation_status ?? user?.validation_status) as ValidationStatus | undefined;

  const handleResoumettre = async () => {
    if (!user?.institut_id) return;
    try {
      await institutService.resoumettre(user.institut_id);
      toast.success(t('institution.dashboard.toasts.resubmitted'));
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message ?? t('institution.dashboard.toasts.error'));
    }
  };

  const { programs: programmes, refetch: refetchProgrammes } = usePrograms({ institut_id: user?.institut_id });
  const { candidatures, loading: loadingCandidatures, refetch: refetchCandidatures } = useInstitutCandidatures();
  const { notifications, unreadCount, loading: loadingNotifications, refetch: refetchNotifications } = useNotifications();

  const stats = [
    { label: t('institution.dashboard.stats.publishedPrograms'), value: String(programmes.length), icon: FileText, color: 'var(--edu-blue)' },
    { label: t('institution.dashboard.stats.newRequests'), value: String(candidatures.filter((c) => c.statut === 'soumise').length), icon: Users, color: 'var(--edu-info)' },
    { label: t('institution.dashboard.stats.inReview'), value: String(candidatures.filter((c) => c.statut === 'en_examen').length), icon: Clock, color: 'var(--edu-warning)' },
    { label: t('institution.dashboard.stats.decisionsRendered'), value: String(candidatures.filter((c) => ['acceptee', 'refusee', 'liste_attente'].includes(c.statut)).length), icon: Send, color: 'var(--edu-success)' },
  ];

  const pipeline = PIPELINE_COLUMNS.reduce<Record<string, Candidature[]>>((acc, col) => {
    acc[col.statut] = candidatures.filter((c) => c.statut === col.statut);
    return acc;
  }, {});

  const candidaturesParMois = candidatures.reduce<Record<string, number>>((acc, c) => {
    if (!c.cree_le) return acc;
    const mois = new Date(c.cree_le).toLocaleString(i18n.language, { month: 'short' });
    acc[mois] = (acc[mois] ?? 0) + 1;
    return acc;
  }, {});
  const dataChart = Object.entries(candidaturesParMois).map(([mois, count]) => ({ mois, candidatures: count }));

  const handleChangerStatut = async (id: string, statut: string) => {
    setProcessingId(id);
    try {
      await candidatureService.changerStatut(id, statut);
      toast.success(t('institution.candidatures.toasts.statusUpdated'));
      refetchCandidatures();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? t('institution.candidatures.toasts.error'));
    } finally { setProcessingId(null); }
  };

  const handleMarkAsRead = async (id: string) => {
    try { await notificationService.markAsRead(id); refetchNotifications(); } catch { /* silent */ }
  };

  const currentDate = new Date().toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">{t('institution.dashboard.label')}</p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">{nomInstitut}</h1>
            <p className="text-[var(--edu-text-secondary)]">{currentDate}</p>
          </div>
          <Button
            onClick={() => {
              if (validationStatus && validationStatus !== 'approved') {
                toast.error(t('institution.dashboard.notValidated'));
                return;
              }
              setShowCreateDialog(true);
            }}
            className={`rounded-full text-white ${validationStatus && validationStatus !== 'approved' ? 'opacity-50 hover:opacity-50 cursor-not-allowed' : 'hover:bg-[var(--edu-blue-hover)]'}`}
            style={{ backgroundColor: validationStatus && validationStatus !== 'approved' ? 'var(--edu-text-tertiary)' : 'var(--edu-blue)' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('institution.dashboard.createProgram')}
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
            <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">{t('institution.dashboard.pipeline.title')}</h2>
            <Link to="/dashboard/institution/candidatures">
              <Button variant="ghost" className="text-[var(--edu-blue)]">{t('common.seeAll')}<ChevronRight className="w-4 h-4 ml-1" /></Button>
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
                        <h3 className="font-semibold text-[var(--edu-text-primary)] text-sm">{t(`institution.dashboard.pipeline.columns.${col.statut}`)}</h3>
                      </div>
                      <span className="text-xs font-semibold text-[var(--edu-text-tertiary)] bg-[var(--edu-surface)] px-2 py-1 rounded-full">{cards.length}</span>
                    </div>
                    <div className="space-y-3">
                      {cards.length === 0 ? (
                        <p className="text-xs text-[var(--edu-text-tertiary)] text-center py-4">{t('institution.dashboard.pipeline.empty')}</p>
                      ) : cards.map((c) => {
                        const nomComplet = [c.candidat?.prenom, c.candidat?.nom].filter(Boolean).join(' ') || 'Candidat';
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCandidat(c)}
                            className="bg-white dark:bg-[#1D1D1F] rounded-xl p-3 border border-[var(--edu-border)] hover:shadow-md hover:border-[var(--edu-blue)]/30 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--edu-blue), #6366F1)' }}>
                                {nomComplet.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-sm font-semibold text-[var(--edu-text-primary)] truncate">{nomComplet}</p>
                            </div>
                            {c.score_diplome != null && (
                              <PipelineScoreChip score={c.score_diplome} />
                            )}
                            <p className="text-xs text-[var(--edu-text-secondary)] mb-1 line-clamp-1 mt-1">{c.programme?.titre ?? 'Programme'}</p>
                            <p className="text-xs text-[var(--edu-text-tertiary)] mb-2">{(c.soumise_le ?? c.cree_le) ? new Date((c.soumise_le ?? c.cree_le)!).toLocaleDateString() : '—'}</p>
                            {transitions.length > 0 && (
                              <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                                {transitions.map((tr) => (
                                  <button key={tr} onClick={() => handleChangerStatut(c.id, tr)} disabled={processingId === c.id}
                                    className="text-xs px-2 py-0.5 rounded-full font-semibold text-white transition-opacity disabled:opacity-50"
                                    style={{ backgroundColor: TRANSITION_COLORS[tr] }}>{t(`institution.candidatures.transitions.${tr}`)}</button>
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
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">{t('institution.dashboard.trend.title')}</h2>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--edu-success)]">
                <TrendingUp className="w-4 h-4" />{candidatures.length} {t('institution.dashboard.trend.total')}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6">
              {dataChart.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-[var(--edu-text-secondary)]">{t('institution.dashboard.trend.noData')}</div>
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
                {t('common.notifications')}
                {unreadCount > 0 && <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: 'var(--edu-danger)' }}>{unreadCount}</span>}
              </h2>
            </div>
            <div className="glass-card rounded-2xl p-6 space-y-4">
              {loadingNotifications ? (
                <p className="text-sm text-[var(--edu-text-secondary)]">{t('common.loading')}</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-[var(--edu-text-secondary)]">{t('common.noNotificationsShort')}</p>
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
                      {!n.est_lue && <button onClick={() => handleMarkAsRead(n.id)} className="text-xs text-[var(--edu-blue)] hover:underline ml-auto">{t('common.markAsRead')}</button>}
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

      {/* Candidat detail Dialog */}
      <Dialog open={selectedCandidat != null} onOpenChange={(open) => { if (!open) setSelectedCandidat(null); }}>
        <DialogContent className="max-w-md rounded-2xl">
          {selectedCandidat && <CandidatDetailDialog candidature={selectedCandidat} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chip score sur les cartes pipeline
// ─────────────────────────────────────────────────────────────
function PipelineScoreChip({ score }: { score: number }) {
  const { t } = useTranslation();
  const color = score >= 70 ? 'var(--edu-success)' : score >= 50 ? 'var(--edu-warning)' : 'var(--edu-danger)';
  const bg    = score >= 70 ? 'rgba(52,199,89,0.1)' : score >= 50 ? 'rgba(255,159,10,0.1)' : 'rgba(255,59,48,0.1)';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ color, backgroundColor: bg }}>
      {t('institution.dashboard.scoreChip')} {score}/100
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Contenu du Dialog candidat
// ─────────────────────────────────────────────────────────────
const STATUT_DIALOG_STYLE: Record<string, { color: string; bg: string }> = {
  soumise:       { color: 'var(--edu-blue)',    bg: 'rgba(0,113,227,0.1)' },
  en_examen:     { color: 'var(--edu-warning)', bg: 'rgba(255,159,10,0.1)' },
  acceptee:      { color: 'var(--edu-success)', bg: 'rgba(52,199,89,0.1)' },
  refusee:       { color: 'var(--edu-danger)',  bg: 'rgba(255,59,48,0.1)' },
  liste_attente: { color: '#8B5CF6',            bg: 'rgba(139,92,246,0.1)' },
};

function CandidatDetailDialog({ candidature }: { candidature: Candidature }) {
  const { t } = useTranslation();
  const nom = [candidature.candidat?.prenom, candidature.candidat?.nom].filter(Boolean).join(' ') || 'Candidat';
  const st  = STATUT_DIALOG_STYLE[candidature.statut] ?? STATUT_DIALOG_STYLE.soumise;
  const date = (candidature.soumise_le ?? candidature.cree_le)
    ? new Date((candidature.soumise_le ?? candidature.cree_le)!).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const score = candidature.score_diplome;

  return (
    <>
      <DialogHeader className="pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--edu-blue), #6366F1)' }}>
            {nom.charAt(0).toUpperCase()}
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-[var(--edu-text-primary)] leading-tight">{nom}</DialogTitle>
            <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">{candidature.programme?.titre ?? '—'}</p>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-3 pt-2">
        <DialogRow label={t('institution.dashboard.candidateDialog.status')}>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: st.color, backgroundColor: st.bg }}>{t(`status.${candidature.statut}`)}</span>
        </DialogRow>

        <DialogRow label={t('institution.dashboard.candidateDialog.score')}>
          {score != null ? (
            (() => {
              const color = score >= 70 ? 'var(--edu-success)' : score >= 50 ? 'var(--edu-warning)' : 'var(--edu-danger)';
              const bg    = score >= 70 ? 'rgba(52,199,89,0.1)' : score >= 50 ? 'rgba(255,159,10,0.1)' : 'rgba(255,59,48,0.1)';
              return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color, backgroundColor: bg }}>{score}/100</span>;
            })()
          ) : (
            <span className="text-sm text-[var(--edu-text-tertiary)]">{t('institution.dashboard.candidateDialog.notVerified')}</span>
          )}
        </DialogRow>

        <DialogRow label={t('institution.dashboard.candidateDialog.submissionDate')}>
          <span className="text-sm text-[var(--edu-text-primary)]">{date}</span>
        </DialogRow>

        {candidature.candidat?.telephone && (
          <DialogRow label={t('institution.dashboard.candidateDialog.phone')}>
            <a href={`tel:${candidature.candidat.telephone}`} className="text-sm text-[var(--edu-blue)] hover:underline flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {candidature.candidat.telephone}
            </a>
          </DialogRow>
        )}
      </div>
    </>
  );
}

function DialogRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[var(--edu-divider)] last:border-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] shrink-0">{label}</p>
      <div className="text-right">{children}</div>
    </div>
  );
}
