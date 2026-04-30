import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/button';
import { usePrograms } from '@/hooks/usePrograms';
import { useAllCandidatures } from '@/hooks/useCandidatures';
import type { Programme } from '@/types/api';

const DOMAINE_LABELS: Record<string, string> = {
  informatique: 'Informatique',
  genie_civil: 'Génie civil',
  electrique: 'Électrique',
  mecanique: 'Mécanique',
  chimie: 'Chimie',
  agronomie: 'Agronomie',
  finance: 'Finance',
  management: 'Management',
};

const NIVEAU_LABELS: Record<string, string> = {
  cycle_preparatoire: 'Cycle préparatoire',
  licence: 'Licence',
  master: 'Master',
  ingenieur: 'Ingénieur',
};

const MODE_LABELS: Record<string, string> = {
  cours_du_jour: 'Cours du jour',
  cours_du_soir: 'Cours du soir',
  alternance: 'Alternance',
  formation_continue: 'Formation continue',
};

const PAGE_SIZE = 10;

export function ProgramsSection() {
  const { programs: programmes, loading } = usePrograms();
  const { candidatures } = useAllCandidatures();

  const [search, setSearch] = React.useState('');
  const [domaineFilter, setDomaineFilter] = React.useState<string>('tous');
  const [niveauFilter, setNiveauFilter] = React.useState<string>('tous');
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    let list = programmes;
    if (domaineFilter !== 'tous') list = list.filter((p) => p.domaine === domaineFilter);
    if (niveauFilter !== 'tous') list = list.filter((p) => p.niveau === niveauFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.titre.toLowerCase().includes(q) ||
          (p.institut?.nom ?? '').toLowerCase().includes(q) ||
          (p.domaine ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [programmes, domaineFilter, niveauFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => { setPage(1); }, [search, domaineFilter, niveauFilter]);

  const candidaturesCount = (programmeId: string) =>
    candidatures.filter((c) => c.programme_id === programmeId).length;

  const now = Date.now();
  const actifs = programmes.filter((p) => p.est_actif).length;
  const expires = programmes.filter(
    (p) => p.date_limite_candidature && new Date(p.date_limite_candidature).getTime() < now
  ).length;

  const stats = [
    { label: 'Total', value: programmes.length, color: 'var(--edu-text-primary)' },
    { label: 'Actifs', value: actifs, color: 'var(--edu-success)' },
    { label: 'Inactifs', value: programmes.length - actifs, color: 'var(--edu-text-tertiary)' },
    { label: 'Expirés', value: expires, color: 'var(--edu-warning)' },
  ];

  const isExpired = (p: Programme) =>
    p.date_limite_candidature ? new Date(p.date_limite_candidature).getTime() < now : false;

  // Domaines disponibles dans les données
  const domaines = React.useMemo(() => {
    const set = new Set(programmes.map((p) => p.domaine).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [programmes]);

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
          Administration
        </p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Programmes</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
          Vue d'ensemble de toutes les formations publiées sur la plateforme
        </p>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
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
              placeholder="Rechercher par titre, institut, domaine…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow"
            />
          </div>
          <select
            value={domaineFilter}
            onChange={(e) => setDomaineFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
          >
            <option value="tous">Tous les domaines</option>
            {domaines.map((d) => (
              <option key={d} value={d}>{DOMAINE_LABELS[d] ?? d}</option>
            ))}
          </select>
          <select
            value={niveauFilter}
            onChange={(e) => setNiveauFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
          >
            <option value="tous">Tous les niveaux</option>
            <option value="cycle_preparatoire">Cycle préparatoire</option>
            <option value="licence">Licence</option>
            <option value="master">Master</option>
            <option value="ingenieur">Ingénieur</option>
          </select>
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
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Programme</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Institut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Niveau / Mode</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Statut</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Candidatures</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Date limite</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Frais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" />
                      <p className="text-sm text-[var(--edu-text-secondary)]">Aucun programme trouvé.</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => {
                    const expired = isExpired(p);
                    const nbCand = candidaturesCount(p.id);

                    return (
                      <tr key={p.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-[var(--edu-text-primary)] truncate max-w-[250px]">{p.titre}</p>
                            {p.domaine && (
                              <span className="text-xs text-[var(--edu-text-tertiary)]">
                                {DOMAINE_LABELS[p.domaine] ?? p.domaine}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)] truncate block max-w-[160px]">
                            {p.institut?.nom ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium text-[var(--edu-text-primary)]">
                              {NIVEAU_LABELS[p.niveau ?? ''] ?? p.niveau ?? '—'}
                            </span>
                            {p.mode && (
                              <p className="text-xs text-[var(--edu-text-tertiary)]">
                                {MODE_LABELS[p.mode] ?? p.mode}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {expired ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--edu-warning)]">
                              <Clock className="w-3 h-3" /> Expiré
                            </span>
                          ) : p.est_actif ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--edu-success)]">
                              <CheckCircle2 className="w-3 h-3" /> Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--edu-text-tertiary)]">
                              <XCircle className="w-3 h-3" /> Inactif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--edu-text-primary)]">
                            <Users className="w-3.5 h-3.5 text-[var(--edu-text-tertiary)]" />
                            {nbCand}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm flex items-center gap-1 ${expired ? 'text-[var(--edu-warning)]' : 'text-[var(--edu-text-secondary)]'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {p.date_limite_candidature
                              ? new Date(p.date_limite_candidature).toLocaleDateString('fr-FR')
                              : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-[var(--edu-text-secondary)] flex items-center justify-end gap-1">
                            {p.frais_inscription != null ? (
                              <>
                                <DollarSign className="w-3.5 h-3.5" />
                                {p.frais_inscription.toLocaleString('fr-FR')} TND
                              </>
                            ) : '—'}
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
                {filtered.length} programme{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}
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
