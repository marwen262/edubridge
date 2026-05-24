import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Users, Search, Shield, Building2, GraduationCap, MoreHorizontal,
  ChevronLeft, ChevronRight, UserX, UserCheck, Trash2, Mail, X, Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useUtilisateurs } from '@/hooks/useUtilisateurs';
import { utilisateurService } from '@/services/api';
import i18n from '@/i18n';
import type { Utilisateur } from '@/types/api';

const ROLES_CONFIG: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  candidat: { color: 'var(--edu-blue)', icon: GraduationCap },
  institut: { color: 'var(--edu-indigo)', icon: Building2 },
  admin: { color: 'var(--edu-danger)', icon: Shield },
};

const INST_STATUS_CLS: Record<string, string> = {
  approved:             'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pending_admin_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  invited:              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  rejected:             'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  suspended:            'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
};

const PAGE_SIZE = 12;

/* ─── Dialog confirmation suppression ─────────────────────── */
function ConfirmDeleteUserDialog({
  open, nom, onConfirm, onCancel,
}: { open: boolean; nom: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = React.useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try { await onConfirm(); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl border border-[var(--edu-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[var(--edu-border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--edu-text-primary)]">{t('admin.users.deleteDialog.title')}</h2>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors">
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-[var(--edu-danger)]" />
          </div>
          <p className="text-center text-sm text-[var(--edu-text-secondary)] leading-relaxed">
            {t('admin.users.deleteDialog.about')}
          </p>
          <p className="text-center font-bold text-[var(--edu-text-primary)] mt-1 mb-3">« {nom} »</p>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700 dark:text-red-300 text-center">
              {t('admin.users.deleteDialog.warning')}
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={submitting} className="rounded-xl">{t('common.cancel')}</Button>
          <Button onClick={handleConfirm} disabled={submitting} className="rounded-xl text-white" style={{ backgroundColor: 'var(--edu-danger)' }}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {t('admin.users.deleteDialog.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Section principale ───────────────────────────────────── */
export function UsersSection() {
  const { t } = useTranslation();
  const { utilisateurs: utilisateursRaw, loading, refetch } = useUtilisateurs();
  const utilisateurs = utilisateursRaw as Utilisateur[];

  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('tous');
  const [page, setPage] = React.useState(1);
  const [actionMenu, setActionMenu] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Utilisateur | null>(null);

  const filtered = React.useMemo(() => {
    let list = utilisateurs;
    if (roleFilter !== 'tous') list = list.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.candidat?.prenom ?? '').toLowerCase().includes(q) ||
          (u.candidat?.nom ?? '').toLowerCase().includes(q) ||
          (u.institut?.nom ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [utilisateurs, roleFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = [
    { labelKey: 'admin.users.stats.total', value: utilisateurs.length, color: 'var(--edu-text-primary)' },
    { labelKey: 'admin.users.stats.candidats', value: utilisateurs.filter((u) => u.role === 'candidat').length, color: 'var(--edu-blue)' },
    { labelKey: 'admin.users.stats.instituts', value: utilisateurs.filter((u) => u.role === 'institut').length, color: 'var(--edu-indigo)' },
    { labelKey: 'admin.users.stats.admins', value: utilisateurs.filter((u) => u.role === 'admin').length, color: 'var(--edu-danger)' },
  ];

  const getNom = (u: Utilisateur): string => {
    if (u.role === 'candidat' && u.candidat) {
      return [u.candidat.prenom, u.candidat.nom].filter(Boolean).join(' ') || u.email;
    }
    if (u.role === 'institut' && u.institut) {
      return u.institut.nom ?? u.email;
    }
    return u.email;
  };

  const getStatut = (u: Utilisateur): { label: string; cls: string } => {
    if (u.role === 'institut' && u.institut?.validation_status) {
      const cls = INST_STATUS_CLS[u.institut.validation_status];
      if (cls) return { label: i18n.t(`admin.instStatus.${u.institut.validation_status}`), cls };
    }
    return u.est_actif !== false
      ? { label: i18n.t('admin.users.userStatus.active'), cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }
      : { label: i18n.t('admin.users.userStatus.disabled'), cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  };

  const handleToggleActif = async (u: Utilisateur) => {
    setProcessing(u.id);
    try {
      await utilisateurService.update(u.id, { est_actif: !u.est_actif });
      toast.success(u.est_actif ? t('admin.users.toasts.deactivated') : t('admin.users.toasts.reactivated'));
      refetch();
    } catch {
      toast.error(t('admin.users.toasts.updateError'));
    } finally {
      setProcessing(null);
      setActionMenu(null);
    }
  };

  const handleSupprimer = (u: Utilisateur) => {
    setDeleteTarget(u);
    setActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(deleteTarget.id);
    try {
      await utilisateurService.delete(deleteTarget.id);
      toast.success(t('admin.users.toasts.deleted'));
      refetch();
    } catch {
      toast.error(t('admin.users.toasts.deleteError'));
    } finally {
      setProcessing(null);
      setDeleteTarget(null);
    }
  };

  React.useEffect(() => { setPage(1); }, [search, roleFilter]);

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">{t('admin.users.sectionLabel')}</p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">{t('admin.users.title')}</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">{t('admin.users.subtitle')}</p>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Mini stats */}
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
            <input type="text" placeholder={t('admin.users.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow" />
          </div>
          <div className="flex gap-2">
            {(['tous', 'candidat', 'institut', 'admin'] as const).map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${roleFilter === r ? 'bg-[var(--edu-indigo)] text-white' : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'}`}>
                {r === 'tous' ? t('admin.users.allFilter') : t(`admin.users.roleLabels.${r}`)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tableau */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[45%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-[var(--edu-surface)]">
              <tr>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.users.columns.user')}</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.users.columns.role')}</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.users.columns.status')}</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.users.columns.registeredAt')}</th>
                <th className="text-right px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.users.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--edu-divider)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" /></td>)}</tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" /><p className="text-sm text-[var(--edu-text-secondary)]">{t('admin.users.empty')}</p></td></tr>
              ) : paginated.map((u) => {
                const nom = getNom(u);
                const initial = nom.charAt(0).toUpperCase();
                const roleCfg = ROLES_CONFIG[u.role] ?? { color: 'var(--edu-text-secondary)', icon: Users };
                const roleLabel = t(`admin.users.roleLabels.${u.role}`, { defaultValue: u.role });
                const RoleIcon = roleCfg.icon;
                const statut = getStatut(u);

                return (
                  <tr key={u.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                    <td className="px-4 py-4 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                          style={{ background: `linear-gradient(135deg, ${roleCfg.color}, var(--edu-indigo))` }}>{initial}</div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="font-medium text-sm text-[var(--edu-text-primary)] truncate">{nom}</p>
                          <p className="text-xs text-[var(--edu-text-tertiary)] truncate flex items-center gap-1"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{u.email}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${roleCfg.color}15`, color: roleCfg.color }}>
                        <RoleIcon className="w-3 h-3 shrink-0" />{roleLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statut.cls}`}>
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-[var(--edu-text-secondary)]">{u.cree_le ? new Date(u.cree_le).toLocaleDateString(i18n.language) : '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end relative">
                        {u.role !== 'admin' && (
                        <Button variant="ghost" size="sm" onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)} disabled={processing === u.id}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        )}
                        {u.role !== 'admin' && actionMenu === u.id && (
                          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-[#2D2D2F] rounded-xl shadow-xl border border-[var(--edu-border)] py-1 animate-in fade-in slide-in-from-top-1">
                            <button onClick={() => handleToggleActif(u)}
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--edu-surface)] text-[var(--edu-text-primary)]">
                              {u.est_actif !== false ? (
                                <><UserX className="w-4 h-4 text-[var(--edu-warning)]" /> {t('admin.users.actions.deactivate')}</>
                              ) : (
                                <><UserCheck className="w-4 h-4 text-[var(--edu-success)]" /> {t('admin.users.actions.reactivate')}</>
                              )}
                            </button>
                            <button onClick={() => handleSupprimer(u)}
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--edu-surface)] text-[var(--edu-danger)]">
                              <Trash2 className="w-4 h-4" /> {t('admin.users.actions.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--edu-text-tertiary)]">{t('admin.users.results', { count: filtered.length })} — {t('common.page')} {page}/{totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Dialog */}
      <ConfirmDeleteUserDialog
        open={deleteTarget !== null}
        nom={getNom(deleteTarget ?? ({} as Utilisateur))}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
