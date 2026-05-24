import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { FileText, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { CreateProgramDialog } from './CreateProgramDialog';
import { EditProgramDialog } from './EditProgramDialog';
import { useAuth } from '@/context/AuthContext';
import { usePrograms } from '@/hooks/usePrograms';
import { useInstitutCandidatures } from '@/hooks/useCandidatures';
import { programmeService } from '@/services/api';
import i18n from '@/i18n';
import type { Programme } from '@/types/api';

const PAGE_SIZE = 10;

export function InstitutionProgramsSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { programs: programmes, loading, refetch } = usePrograms({ institut_id: user?.institut_id });
  const { candidatures } = useInstitutCandidatures();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Programme | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; titre: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return programmes;
    const q = search.toLowerCase();
    return programmes.filter((p) => p.titre.toLowerCase().includes(q) || (p.domaine ?? '').toLowerCase().includes(q));
  }, [programmes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => { setPage(1); }, [search]);

  const candCount = (pid: string) => candidatures.filter((c) => c.programme_id === pid).length;

  const handleToggleActif = async (p: Programme) => {
    setToggling(p.id);
    try {
      await programmeService.update(p.id, { est_actif: !p.est_actif } as never);
      toast.success(p.est_actif ? t('institution.programs.toasts.deactivated') : t('institution.programs.toasts.activated'));
      refetch();
    } catch { toast.error(t('institution.programs.toasts.toggleError')); }
    finally { setToggling(null); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await programmeService.delete(deleteConfirm.id);
      toast.success(t('institution.programs.toasts.deleted'));
      refetch();
    } catch { toast.error(t('institution.programs.toasts.deleteError')); }
    finally { setDeleting(false); setDeleteConfirm(null); }
  };

  return (
    <div>
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">{t('institution.programs.sectionLabel')}</p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">{t('institution.programs.title')}</h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">{t('institution.programs.subtitle')}</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
            <Plus className="w-5 h-5 mr-2" /> {t('institution.programs.createProgram')}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input type="text" placeholder={t('institution.programs.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]" />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.programs.columns.title')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.programs.columns.level')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.programs.columns.status')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.programs.columns.applications')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.programs.columns.deadline')}</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('institution.programs.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" /></td>)}</tr>
                )) : paginated.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" />
                    <p className="text-sm text-[var(--edu-text-secondary)]">{t('institution.programs.empty')}</p>
                  </td></tr>
                ) : paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                    <td className="px-6 py-4"><p className="font-medium text-[var(--edu-text-primary)]">{p.titre}</p>{p.domaine && <p className="text-xs text-[var(--edu-text-tertiary)]">{p.domaine}</p>}</td>
                    <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">{p.niveau ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ color: p.est_actif ? 'var(--edu-success)' : 'var(--edu-text-secondary)', backgroundColor: p.est_actif ? 'rgba(52,199,89,0.1)' : 'var(--edu-surface)' }}>
                        {p.est_actif ? t('status.actif') : t('status.inactif')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--edu-text-primary)]">{candCount(p.id)}</td>
                    <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">{p.date_limite_candidature ? new Date(p.date_limite_candidature).toLocaleDateString(i18n.language) : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingProgram(p)} title={t('common.edit')}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleToggleActif(p)}
                          disabled={toggling === p.id}
                          title={p.est_actif ? t('institution.programs.deactivate') : t('institution.programs.activate')}
                        >
                          {p.est_actif
                            ? <EyeOff className="w-4 h-4 text-[var(--edu-warning)]" />
                            : <Eye className="w-4 h-4 text-[var(--edu-success)]" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ id: p.id, titre: p.titre })}>
                          <Trash2 className="w-4 h-4 text-[var(--edu-danger)]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--edu-text-tertiary)]">
                {filtered.length} {filtered.length !== 1 ? t('institution.programs.paginationPlural') : t('institution.programs.pagination')} — {t('common.page')} {page}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialog création */}
      {user?.institut_id && (
        <CreateProgramDialog institutId={user.institut_id} open={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />
      )}

      {/* Dialog modification */}
      <EditProgramDialog
        programme={editingProgram}
        open={editingProgram !== null}
        onClose={() => setEditingProgram(null)}
        onUpdated={() => { setEditingProgram(null); refetch(); }}
      />

      {/* Dialog confirmation suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl border border-[var(--edu-border)] p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,59,48,0.1)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--edu-danger)' }} />
              </div>
              <h3 className="text-base font-bold text-[var(--edu-text-primary)]">{t('institution.programs.deleteConfirm.title')}</h3>
            </div>
            <p className="text-sm text-[var(--edu-text-secondary)] mb-6">
              <span className="font-semibold text-[var(--edu-text-primary)]">« {deleteConfirm.titre} »</span> {t('institution.programs.deleteConfirm.body')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting} className="rounded-xl">
                {t('institution.programs.deleteConfirm.cancel')}
              </Button>
              <Button onClick={confirmDelete} disabled={deleting} className="rounded-xl text-white" style={{ backgroundColor: 'var(--edu-danger)' }}>
                {deleting ? t('institution.programs.deleteConfirm.deleting') : t('institution.programs.deleteConfirm.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
