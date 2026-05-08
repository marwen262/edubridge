import React from 'react';
import { useTranslation } from 'react-i18next';
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
import i18n from '@/i18n';
import type { Programme } from '@/types/api';

const PAGE_SIZE = 10;

export function ProgramsSection() {
  const { t } = useTranslation();
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
    { labelKey: 'admin.programs.stats.total', value: programmes.length, color: 'var(--edu-text-primary)' },
    { labelKey: 'admin.programs.stats.active', value: actifs, color: 'var(--edu-success)' },
    { labelKey: 'admin.programs.stats.inactive', value: programmes.length - actifs, color: 'var(--edu-text-tertiary)' },
    { labelKey: 'admin.programs.stats.expired', value: expires, color: 'var(--edu-warning)' },
  ];

  const isExpired = (p: Programme) =>
    p.date_limite_candidature ? new Date(p.date_limite_candidature).getTime() < now : false;

  const domaines = React.useMemo(() => {
    const set = new Set(programmes.map((p) => p.domaine).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [programmes]);

  const niveaux = ['cycle_preparatoire', 'licence', 'master', 'ingenieur'] as const;

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">
          {t('admin.programs.sectionLabel')}
        </p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">{t('admin.programs.title')}</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
          {t('admin.programs.subtitle')}
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
              placeholder={t('admin.programs.searchPlaceholder')}
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
            <option value="tous">{t('admin.programs.allDomains')}</option>
            {domaines.map((d) => (
              <option key={d} value={d}>{t(`admin.programs.domains.${d}`, { defaultValue: d })}</option>
            ))}
          </select>
          <select
            value={niveauFilter}
            onChange={(e) => setNiveauFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
          >
            <option value="tous">{t('admin.programs.allLevels')}</option>
            {niveaux.map((n) => (
              <option key={n} value={n}>{t(`program.levels.${n}`)}</option>
            ))}
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
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.programs.columns.program')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.programs.columns.institut')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.programs.columns.levelMode')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.programs.columns.status')}</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.programs.columns.applications')}</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.programs.columns.deadline')}</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.programs.columns.fees')}</th>
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
                      <p className="text-sm text-[var(--edu-text-secondary)]">{t('admin.programs.empty')}</p>
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
                                {t(`admin.programs.domains.${p.domaine}`, { defaultValue: p.domaine })}
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
                              {p.niveau ? t(`program.levels.${p.niveau}`, { defaultValue: p.niveau }) : '—'}
                            </span>
                            {p.mode && (
                              <p className="text-xs text-[var(--edu-text-tertiary)]">
                                {t(`admin.programs.modes.${p.mode}`, { defaultValue: p.mode })}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {expired ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--edu-warning)]">
                              <Clock className="w-3 h-3" /> {t('admin.programs.status.expired')}
                            </span>
                          ) : p.est_actif ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--edu-success)]">
                              <CheckCircle2 className="w-3 h-3" /> {t('admin.programs.status.active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--edu-text-tertiary)]">
                              <XCircle className="w-3 h-3" /> {t('admin.programs.status.inactive')}
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
                              ? new Date(p.date_limite_candidature).toLocaleDateString(i18n.language)
                              : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-[var(--edu-text-secondary)] flex items-center justify-end gap-1">
                            {p.frais_inscription != null ? (
                              <>
                                <DollarSign className="w-3.5 h-3.5" />
                                {p.frais_inscription.toLocaleString(i18n.language)} TND
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
                {t('admin.programs.results', { count: filtered.length })} — {t('common.page')} {page}/{totalPages}
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
