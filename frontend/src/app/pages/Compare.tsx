import React from 'react';
import { Link } from 'react-router';
import { X, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { programmeService } from '@/services/api';
import type { Programme } from '@/types/api';
import { motion } from 'motion/react';
import { useComparaison } from '@/hooks/useComparaison';
import i18n from '@/i18n';

// Normalise un champ JSONB qui peut arriver soit comme tableau, soit comme string JSON (anciens seeds)
const parseJsonbArray = (v: unknown): Record<string, unknown>[] => {
  if (Array.isArray(v)) return v as Record<string, unknown>[];
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};

export function Compare() {
  const { t } = useTranslation();
  const [programmes, setProgrammes] = React.useState<Programme[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { ids, retirer } = useComparaison();

  React.useEffect(() => {
    if (ids.length === 0) {
      setProgrammes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    // L'API renvoie { programme: {...} } : on extrait donc r.data.programme.
    // allSettled évite qu'un id obsolète (404) ne casse toute la comparaison.
    Promise.allSettled(ids.map((id) => programmeService.getById(id)))
      .then((results) => {
        if (cancelled) return;
        const items: Programme[] = [];
        let failures = 0;
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            const payload = r.value.data as { programme?: Programme } | undefined;
            if (payload?.programme) items.push(payload.programme);
            else failures += 1;
          } else {
            failures += 1;
          }
        });
        setProgrammes(items);
        if (items.length === 0 && failures > 0) {
          setError(t('compare.loadError'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ids, t]);

  const handleRemove = (id: string) => {
    retirer(id);
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
  };

  const comparisonRows: { label: string; getValue: (p: Programme) => React.ReactNode }[] = [
    { label: t('compare.rows.institute'), getValue: (p) => p.institut?.nom ?? '—' },
    {
      label: t('compare.rows.location'),
      getValue: (p) =>
        [p.institut?.adresse?.ville, p.institut?.adresse?.pays].filter(Boolean).join(', ') || '—',
    },
    {
      label: t('compare.rows.level'),
      getValue: (p) =>
        p.niveau ? t(`program.levels.${p.niveau}`, { defaultValue: p.niveau }) : '—',
    },
    {
      label: t('compare.rows.domain'),
      getValue: (p) =>
        p.domaine ? t(`admin.programs.domains.${p.domaine}`, { defaultValue: p.domaine }) : '—',
    },
    {
      label: t('compare.rows.mode'),
      getValue: (p) =>
        p.mode ? t(`admin.programs.modes.${p.mode}`, { defaultValue: p.mode }) : '—',
    },
    {
      label: t('compare.rows.duration'),
      getValue: (p) =>
        p.duree_annees != null
          ? p.duree_annees > 1
            ? t('compare.rows.durationYearsPlural', { count: p.duree_annees })
            : t('compare.rows.durationYears', { count: p.duree_annees })
          : '—',
    },
    { label: t('compare.rows.language'), getValue: (p) => p.langue ?? '—' },
    {
      label: t('compare.rows.tuition'),
      getValue: (p) =>
        p.frais_inscription != null ? `${p.frais_inscription.toLocaleString()} TND` : 'N/A',
    },
    {
      label: t('compare.rows.deadline'),
      getValue: (p) =>
        p.date_limite_candidature
          ? new Date(p.date_limite_candidature).toLocaleDateString(i18n.language)
          : '—',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">
              {t('compare.title')}
            </h1>
            <p className="text-lg text-[var(--edu-text-secondary)]">
              {t('compare.subtitle')}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--edu-blue)]" />
            </div>
          ) : error ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <p className="text-[var(--edu-danger)] text-lg mb-6">{error}</p>
              <Link to="/search">
                <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                  {t('compare.backToSearch')}
                </Button>
              </Link>
            </div>
          ) : programmes.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <p className="text-[var(--edu-text-secondary)] text-lg mb-6">
                {t('compare.emptyTitle')}
              </p>
              <p className="text-sm text-[var(--edu-text-tertiary)] mb-8">
                {t('compare.emptyHint')}
              </p>
              <Link to="/search">
                <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                  {t('compare.browsePrograms')}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--edu-surface)]">
                        <th className="sticky left-0 bg-[var(--edu-surface)] px-6 py-4 text-left font-semibold text-[var(--edu-text-primary)] min-w-[200px]">
                          {t('compare.criterion')}
                        </th>
                        {programmes.map((programme) => {
                          // Pré-calculs sécurisés : éviter tout .charAt() sur undefined
                          const cover =
                            programme.institut?.image_couverture ?? programme.institut?.logo;
                          const titre = programme.titre ?? 'Programme sans titre';
                          const initialeCover = programme.titre?.charAt(0) ?? '?';
                          const initialeLogo =
                            (programme.institut?.nom ?? programme.titre)?.charAt(0) ?? '?';
                          return (
                            <th key={programme.id} className="px-6 py-4 min-w-[280px]">
                              <div className="space-y-4">
                                {/* Image de couverture */}
                                <div className="relative">
                                  {cover ? (
                                    <img
                                      src={cover}
                                      alt={titre}
                                      className="w-full h-32 object-cover rounded-xl"
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-[var(--edu-blue)]/10 rounded-xl flex items-center justify-center">
                                      <span className="text-2xl font-bold text-[var(--edu-blue)]">
                                        {initialeCover}
                                      </span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleRemove(programme.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-[#1D1D1F] rounded-full hover:bg-[var(--edu-danger)] hover:text-white transition-colors"
                                    aria-label={t('compare.removeAriaLabel')}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                {/* Logo + titre */}
                                <div className="flex items-center gap-3">
                                  {programme.institut?.logo ? (
                                    <img
                                      src={programme.institut.logo}
                                      alt={programme.institut?.nom ?? 'Institut'}
                                      className="w-12 h-12 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-[var(--edu-blue)]/10 flex items-center justify-center">
                                      <span className="text-lg font-bold text-[var(--edu-blue)]">
                                        {initialeLogo}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-left flex-1 min-w-0">
                                    <p className="font-semibold text-[var(--edu-text-primary)] text-sm line-clamp-2">
                                      {titre}
                                    </p>
                                  </div>
                                </div>
                                <Link to={`/program/${programme.id}`}>
                                  <Button
                                    size="sm"
                                    className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
                                  >
                                    {t('compare.viewDetails')}
                                  </Button>
                                </Link>
                              </div>
                            </th>
                          );
                        })}
                        {programmes.length < 3 && (
                          <th className="px-6 py-4 min-w-[280px]">
                            <Link to="/search">
                              <div className="h-full flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed border-[var(--edu-border)] rounded-2xl hover:border-[var(--edu-blue)] transition-colors cursor-pointer">
                                <div className="w-16 h-16 rounded-full bg-[var(--edu-surface)] flex items-center justify-center">
                                  <Plus className="w-8 h-8 text-[var(--edu-text-tertiary)]" />
                                </div>
                                <p className="text-sm text-[var(--edu-text-secondary)]">
                                  {t('compare.addProgram')}
                                </p>
                              </div>
                            </Link>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--edu-divider)]">
                      {comparisonRows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={rowIdx % 2 === 0 ? 'bg-[var(--edu-surface)]/50' : ''}
                        >
                          <td className="sticky left-0 bg-inherit px-6 py-4 font-semibold text-[var(--edu-text-primary)]">
                            {row.label}
                          </td>
                          {programmes.map((p) => (
                            <td key={p.id} className="px-6 py-4 text-[var(--edu-text-secondary)]">
                              {row.getValue(p)}
                            </td>
                          ))}
                          {programmes.length < 3 && <td className="px-6 py-4" />}
                        </tr>
                      ))}

                      {/* Documents requis */}
                      <tr>
                        <td className="sticky left-0 bg-[var(--edu-surface)]/50 px-6 py-4 font-semibold text-[var(--edu-text-primary)]">
                          {t('compare.rows.requiredDocuments')}
                        </td>
                        {programmes.map((p) => {
                          const docs = parseJsonbArray(p.documents_requis);
                          return (
                            <td key={p.id} className="px-6 py-4">
                              {docs.length > 0 ? (
                                <ul className="space-y-1 text-sm text-[var(--edu-text-secondary)]">
                                  {docs.slice(0, 3).map((doc, i) => (
                                    <li key={i} className="line-clamp-1">
                                      •&nbsp;{String(doc.nom)}
                                      {doc.obligatoire ? ' *' : ''}
                                    </li>
                                  ))}
                                  {docs.length > 3 && (
                                    <li className="text-[var(--edu-blue)]">
                                      {t('compare.rows.moreDocuments', { count: docs.length - 3 })}
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                <span className="text-[var(--edu-text-tertiary)] text-sm">—</span>
                              )}
                            </td>
                          );
                        })}
                        {programmes.length < 3 && <td className="px-6 py-4" />}
                      </tr>

                      {/* Prérequis */}
                      <tr className="bg-[var(--edu-surface)]/50">
                        <td className="sticky left-0 bg-inherit px-6 py-4 font-semibold text-[var(--edu-text-primary)]">
                          {t('compare.rows.prerequisites')}
                        </td>
                        {programmes.map((p) => {
                          const prereq = typeof p.prerequis === 'string'
                            ? (() => { try { return JSON.parse(p.prerequis); } catch { return null; } })()
                            : p.prerequis;
                          return (
                            <td key={p.id} className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">
                              {prereq ? (
                                <div className="space-y-1">
                                  {prereq.moyenne_min != null && (
                                    <p>{t('compare.rows.minAverage', { value: prereq.moyenne_min })}</p>
                                  )}
                                  {Array.isArray(prereq.types_bac) && prereq.types_bac.length > 0 && (
                                    <p>{t('compare.rows.bacTypes', { types: prereq.types_bac.join(', ') })}</p>
                                  )}
                                  {Array.isArray(prereq.matieres) && prereq.matieres.length > 0 && (
                                    <p>{t('compare.rows.subjects', { subjects: prereq.matieres.join(', ') })}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[var(--edu-text-tertiary)]">—</span>
                              )}
                            </td>
                          );
                        })}
                        {programmes.length < 3 && <td className="px-6 py-4" />}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-center mt-8">
                <Link to="/search">
                  <Button variant="outline" className="rounded-full">
                    {t('compare.browseMore')}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
