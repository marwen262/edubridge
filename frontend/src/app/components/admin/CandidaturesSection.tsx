import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  BarChart3,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ListFilter,
} from 'lucide-react';
import { Pagination } from '../Pagination';
import { useAllCandidatures } from '@/hooks/useCandidatures';
import i18n from '@/i18n';
import type { Candidature, CandidatureFilters } from '@/types/api';

const STATUT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  soumise:       Clock,
  en_examen:     AlertTriangle,
  acceptee:      CheckCircle2,
  refusee:       XCircle,
  liste_attente: ListFilter,
  brouillon:     Clock,
};

const STATUT_STYLE: Record<string, { color: string; bg: string }> = {
  soumise:       { color: 'var(--edu-blue)',    bg: 'rgba(0,113,227,0.1)'   },
  en_examen:     { color: 'var(--edu-warning)', bg: 'rgba(255,159,10,0.1)'  },
  acceptee:      { color: 'var(--edu-success)', bg: 'rgba(52,199,89,0.1)'   },
  refusee:       { color: 'var(--edu-danger)',  bg: 'rgba(255,59,48,0.1)'   },
  liste_attente: { color: '#8B5CF6',            bg: 'rgba(139,92,246,0.1)'  },
  brouillon:     { color: 'var(--edu-text-tertiary)', bg: 'rgba(156,163,175,0.1)' },
};

const PAGE_SIZE = 12;

export function CandidaturesSection() {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState('');
  const [statutFilter, setStatutFilter] = React.useState<string>('tous');
  const [page, setPage] = React.useState(1);

  const tableFilters = React.useMemo<CandidatureFilters>(() => ({
    page,
    limit: PAGE_SIZE,
    statut: statutFilter !== 'tous' ? (statutFilter as CandidatureFilters['statut']) : undefined,
  }), [page, statutFilter]);

  const { candidatures, pagination, loading } = useAllCandidatures(tableFilters);

  const { candidatures: candidaturesStats, pagination: statsPagination } = useAllCandidatures();

  const visible = React.useMemo(() => {
    if (!search.trim()) return candidatures;
    const q = search.toLowerCase();
    return candidatures.filter(
      (c) =>
        (c.programme?.titre ?? '').toLowerCase().includes(q) ||
        (c.programme?.institut?.nom ?? '').toLowerCase().includes(q) ||
        (c.candidat?.prenom ?? '').toLowerCase().includes(q) ||
        (c.candidat?.nom ?? '').toLowerCase().includes(q)
    );
  }, [candidatures, search]);

  React.useEffect(() => { setPage(1); }, [statutFilter]);

  const getNomCandidat = (c: Candidature) => {
    const prenom = c.candidat?.prenom ?? '';
    const nom = c.candidat?.nom ?? '';
    return [prenom, nom].filter(Boolean).join(' ') || t('admin.candidatures.unknownCandidat');
  };

  const totalGlobal = statsPagination?.total ?? candidaturesStats.length;
  const stats = [
    { labelKey: 'admin.candidatures.stats.total', value: totalGlobal, color: 'var(--edu-text-primary)' },
    { labelKey: 'admin.candidatures.stats.submitted', value: candidaturesStats.filter((c) => c.statut === 'soumise').length, color: 'var(--edu-blue)' },
    { labelKey: 'admin.candidatures.stats.inReview', value: candidaturesStats.filter((c) => c.statut === 'en_examen').length, color: 'var(--edu-warning)' },
    { labelKey: 'admin.candidatures.stats.accepted', value: candidaturesStats.filter((c) => c.statut === 'acceptee').length, color: 'var(--edu-success)' },
    { labelKey: 'admin.candidatures.stats.rejected', value: candidaturesStats.filter((c) => c.statut === 'refusee').length, color: 'var(--edu-danger)' },
  ];

  const statutFilters = ['tous', 'soumise', 'en_examen', 'acceptee', 'refusee', 'liste_attente'] as const;

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
          {t('admin.candidatures.sectionLabel')}
        </p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">{t('admin.candidatures.title')}</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
          {t('admin.candidatures.subtitle')}
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
            <div key={s.labelKey} className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-5 border border-[var(--edu-border)]">
              <p className="text-3xl font-bold tracking-tight" style={{ color: s.color }}>
                {loading ? <span className="inline-block w-10 h-8 bg-[var(--edu-surface)] rounded animate-pulse" /> : s.value}
              </p>
              <p className="text-xs text-[var(--edu-text-secondary)] mt-1">{t(s.labelKey)}</p>
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
              placeholder={t('admin.candidatures.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statutFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatutFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statutFilter === s
                    ? 'bg-[var(--edu-indigo)] text-white'
                    : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'
                }`}
              >
                {s === 'tous' ? t('admin.candidatures.allFilter') : t(`admin.candidatures.statuses.${s}`, { defaultValue: s })}
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
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.candidatures.columns.candidat')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.candidatures.columns.program')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.candidatures.columns.institut')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.candidatures.columns.status')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.candidatures.columns.submittedAt')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.candidatures.columns.documents')}</th>
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
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" />
                      <p className="text-sm text-[var(--edu-text-secondary)]">{t('admin.candidatures.empty')}</p>
                    </td>
                  </tr>
                ) : (
                  visible.map((c) => {
                    const nom = getNomCandidat(c);
                    const initial = nom.charAt(0).toUpperCase();
                    const statut = c.statut ?? 'soumise';
                    const stStyle = STATUT_STYLE[statut] ?? STATUT_STYLE.soumise;
                    const StIcon = STATUT_ICONS[statut] ?? Clock;
                    const statutLabel = t(`admin.candidatures.statuses.${statut}`, { defaultValue: statut });
                    const docCount = c.documents_soumis?.length ?? 0;

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
                            style={{ backgroundColor: stStyle.bg, color: stStyle.color }}
                          >
                            <StIcon className="w-3 h-3" />
                            {statutLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">
                            {c.soumise_le
                              ? new Date(c.soumise_le).toLocaleDateString(i18n.language)
                              : c.cree_le
                                ? new Date(c.cree_le).toLocaleDateString(i18n.language)
                                : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">
                            {t('admin.candidatures.files', { count: docCount })}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)]">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                totalItems={pagination.total}
                itemLabel={t('admin.candidatures.title').toLowerCase()}
                disabled={loading}
                className="!mt-0"
              />
              {search.trim() && (
                <p className="text-xs text-[var(--edu-text-tertiary)] text-center mt-2 italic">
                  {t('admin.candidatures.searchNote')}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
