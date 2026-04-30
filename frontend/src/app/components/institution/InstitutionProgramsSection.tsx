import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { FileText, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { CreateProgramDialog } from './CreateProgramDialog';
import { useAuth } from '@/context/AuthContext';
import { usePrograms } from '@/hooks/usePrograms';
import { useInstitutCandidatures } from '@/hooks/useCandidatures';
import { programmeService } from '@/services/api';

const PAGE_SIZE = 10;

export function InstitutionProgramsSection() {
  const { user } = useAuth();
  const { programs: programmes, loading, refetch } = usePrograms({ institut_id: user?.institut_id });
  const { candidatures } = useInstitutCandidatures();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return programmes;
    const q = search.toLowerCase();
    return programmes.filter((p) => p.titre.toLowerCase().includes(q) || (p.domaine ?? '').toLowerCase().includes(q));
  }, [programmes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => { setPage(1); }, [search]);

  const candCount = (pid: string) => candidatures.filter((c) => c.programme_id === pid).length;

  const handleDelete = async (id: string, titre: string) => {
    if (!window.confirm(`Supprimer définitivement « ${titre} » ?`)) return;
    setDeleting(id);
    try {
      await programmeService.delete(id);
      toast.success('Programme supprimé.');
      refetch();
    } catch { toast.error('Erreur lors de la suppression.'); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">Établissement</p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Programmes</h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">Gérez vos formations</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
            <Plus className="w-5 h-5 mr-2" /> Créer un programme
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input type="text" placeholder="Rechercher un programme…" value={search} onChange={(e) => setSearch(e.target.value)}
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
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Titre</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Niveau</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Statut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Candidatures</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Date limite</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" /></td>)}</tr>
                )) : paginated.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" />
                    <p className="text-sm text-[var(--edu-text-secondary)]">Aucun programme.</p>
                  </td></tr>
                ) : paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                    <td className="px-6 py-4"><p className="font-medium text-[var(--edu-text-primary)]">{p.titre}</p>{p.domaine && <p className="text-xs text-[var(--edu-text-tertiary)]">{p.domaine}</p>}</td>
                    <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">{p.niveau ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ color: p.est_actif ? 'var(--edu-success)' : 'var(--edu-text-secondary)', backgroundColor: p.est_actif ? 'rgba(52,199,89,0.1)' : 'var(--edu-surface)' }}>
                        {p.est_actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--edu-text-primary)]">{candCount(p.id)}</td>
                    <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">{p.date_limite_candidature ? new Date(p.date_limite_candidature).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" disabled={deleting === p.id} onClick={() => handleDelete(p.id, p.titre)}>
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
              <p className="text-xs text-[var(--edu-text-tertiary)]">{filtered.length} programme{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {user?.institut_id && (
        <CreateProgramDialog institutId={user.institut_id} open={showCreate} onClose={() => setShowCreate(false)} onCreated={refetch} />
      )}
    </div>
  );
}
