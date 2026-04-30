import React from 'react';
import { motion } from 'motion/react';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useInstitutCandidatures } from '@/hooks/useCandidatures';
import type { Candidature } from '@/types/api';

const PAGE_SIZE = 12;

export function InstitutionCandidatsSection() {
  const { candidatures, loading } = useInstitutCandidatures();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);

  // Déduplique les candidats (un même candidat peut postuler à plusieurs programmes)
  const candidats = React.useMemo(() => {
    const map = new Map<string, { id: string; prenom: string; nom: string; email: string; programmes: string[]; dernierStatut: string; date: string }>();
    candidatures.forEach((c: Candidature) => {
      const cid = c.candidat_id;
      const existing = map.get(cid);
      const prenom = c.candidat?.prenom ?? '';
      const nom = c.candidat?.nom ?? '';
      if (existing) {
        existing.programmes.push(c.programme?.titre ?? '—');
        existing.dernierStatut = c.statut;
      } else {
        map.set(cid, {
          id: cid,
          prenom,
          nom,
          email: '',
          programmes: [c.programme?.titre ?? '—'],
          dernierStatut: c.statut,
          date: c.soumise_le ?? c.cree_le ?? '',
        });
      }
    });
    return Array.from(map.values());
  }, [candidatures]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return candidats;
    const q = search.toLowerCase();
    return candidats.filter((c) => c.prenom.toLowerCase().includes(q) || c.nom.toLowerCase().includes(q) || c.programmes.some((p) => p.toLowerCase().includes(q)));
  }, [candidats, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => { setPage(1); }, [search]);

  return (
    <div>
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">Établissement</p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Candidats</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">Liste des candidats ayant postulé à vos programmes</p>
      </div>
      <div className="p-8 space-y-6 max-w-[1600px]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input type="text" placeholder="Rechercher un candidat…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Candidat</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Programmes postulés</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Nb. candidatures</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 4 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" /></td>)}</tr>
                )) : paginated.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" /><p className="text-sm text-[var(--edu-text-secondary)]">Aucun candidat.</p></td></tr>
                ) : paginated.map((c) => {
                  const fullName = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Candidat';
                  return (
                    <tr key={c.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, var(--edu-blue), #6366F1)' }}>{fullName.charAt(0).toUpperCase()}</div>
                          <span className="text-sm font-medium text-[var(--edu-text-primary)]">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 max-w-[250px]">
                          {c.programmes.slice(0, 2).map((p, i) => <p key={i} className="text-xs text-[var(--edu-text-secondary)] truncate">{p}</p>)}
                          {c.programmes.length > 2 && <p className="text-xs text-[var(--edu-text-tertiary)]">+{c.programmes.length - 2} autre{c.programmes.length - 2 > 1 ? 's' : ''}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-sm text-[var(--edu-text-primary)]">{c.programmes.length}</td>
                      <td className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--edu-text-tertiary)]">{filtered.length} candidat{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
