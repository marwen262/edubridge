import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ListFilter,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAllCandidatures } from '@/hooks/useCandidatures';
import type { Candidature } from '@/types/api';

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  soumise:       { label: 'Soumise',        color: 'var(--edu-blue)',    bg: 'rgba(0,113,227,0.1)',  icon: Clock },
  en_examen:     { label: 'En examen',      color: 'var(--edu-warning)', bg: 'rgba(255,159,10,0.1)', icon: AlertTriangle },
  acceptee:      { label: 'Acceptée',       color: 'var(--edu-success)', bg: 'rgba(52,199,89,0.1)',  icon: CheckCircle2 },
  refusee:       { label: 'Refusée',        color: 'var(--edu-danger)',  bg: 'rgba(255,59,48,0.1)',  icon: XCircle },
  liste_attente: { label: "Liste d'attente", color: '#8B5CF6',          bg: 'rgba(139,92,246,0.1)', icon: ListFilter },
  brouillon:     { label: 'Brouillon',      color: 'var(--edu-text-tertiary)', bg: 'rgba(156,163,175,0.1)', icon: Clock },
};

const PAGE_SIZE = 12;

export function CandidaturesSection() {
  const { candidatures, loading } = useAllCandidatures();

  const [search, setSearch] = React.useState('');
  const [statutFilter, setStatutFilter] = React.useState<string>('tous');
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    let list = candidatures;
    if (statutFilter !== 'tous') list = list.filter((c) => c.statut === statutFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.programme?.titre ?? '').toLowerCase().includes(q) ||
          (c.programme?.institut?.nom ?? '').toLowerCase().includes(q) ||
          (c.candidat?.prenom ?? '').toLowerCase().includes(q) ||
          (c.candidat?.nom ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [candidatures, statutFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => { setPage(1); }, [search, statutFilter]);

  const getNomCandidat = (c: Candidature) => {
    const prenom = c.candidat?.prenom ?? '';
    const nom = c.candidat?.nom ?? '';
    return [prenom, nom].filter(Boolean).join(' ') || 'Candidat inconnu';
  };

  const stats = [
    { label: 'Total', value: candidatures.length, color: 'var(--edu-text-primary)' },
    { label: 'Soumises', value: candidatures.filter((c) => c.statut === 'soumise').length, color: 'var(--edu-blue)' },
    { label: 'En examen', value: candidatures.filter((c) => c.statut === 'en_examen').length, color: 'var(--edu-warning)' },
    { label: 'Acceptées', value: candidatures.filter((c) => c.statut === 'acceptee').length, color: 'var(--edu-success)' },
    { label: 'Refusées', value: candidatures.filter((c) => c.statut === 'refusee').length, color: 'var(--edu-danger)' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
          Administration
        </p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Candidatures</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
          Suivi global de toutes les candidatures de la plateforme
        </p>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-5 border border-[var(--edu-border)]">
              <p className="text-3xl font-bold tracking-tight" style={{ color: s.color }}>
                {loading ? <span className="inline-block w-10 h-8 bg-[var(--edu-surface)] rounded animate-pulse" /> : s.value}
              </p>
              <p className="text-xs text-[var(--edu-text-secondary)] mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input
              type="text"
              placeholder="Rechercher par candidat, programme, institut…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['tous', 'soumise', 'en_examen', 'acceptee', 'refusee', 'liste_attente'].map((s) => (
              <button
                key={s}
                onClick={() => setStatutFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statutFilter === s
                    ? 'bg-[var(--edu-indigo)] text-white'
                    : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'
                }`}
              >
                {s === 'tous' ? 'Toutes' : STATUT_CONFIG[s]?.label ?? s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tableau */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Candidat</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Programme</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Institut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Statut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Soumise le</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" />
                      <p className="text-sm text-[var(--edu-text-secondary)]">Aucune candidature trouvée.</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => {
                    const nom = getNomCandidat(c);
                    const initial = nom.charAt(0).toUpperCase();
                    const stCfg = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG.soumise;
                    const StIcon = stCfg.icon;

                    return (
                      <tr key={c.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                              style={{ background: 'linear-gradient(135deg, var(--edu-blue), #6366F1)' }}
                            >
                              {initial}
                            </div>
                            <span className="text-sm font-medium text-[var(--edu-text-primary)] truncate max-w-[140px]">{nom}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-primary)] truncate block max-w-[180px]">
                            {c.programme?.titre ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)] truncate block max-w-[140px]">
                            {c.programme?.institut?.nom ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: stCfg.bg, color: stCfg.color }}
                          >
                            <StIcon className="w-3 h-3" />
                            {stCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">
                            {c.soumise_le
                              ? new Date(c.soumise_le).toLocaleDateString('fr-FR')
                              : c.cree_le
                                ? new Date(c.cree_le).toLocaleDateString('fr-FR')
                                : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">
                            {c.documents_soumis?.length ?? 0} fichier{(c.documents_soumis?.length ?? 0) !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--edu-text-tertiary)]">
                {filtered.length} candidature{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
