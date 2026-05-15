import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCard } from '../components/SkeletonCard';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { fields } from '../data/staticData';
import { usePrograms } from '@/hooks/usePrograms';
import type { ProgrammeFilters } from '@/types/api';

// Taille de page côté serveur. Le filtrage local (tuition, multi-domaine,
// multi-niveau) est appliqué après la pagination — quand de tels filtres sont
// actifs, les pages peuvent contenir moins d'items que `PAGE_SIZE`.
const PAGE_SIZE = 12;

// Niveaux backend disponibles
const niveauxBackend = ['cycle_preparatoire', 'licence', 'master', 'ingenieur'] as const;

// Mapping libellés UI (staticData.fields) → enum backend `domaine`.
type DomaineBackend = NonNullable<ProgrammeFilters['domaine']>;
const FIELD_TO_DOMAINE: Record<string, DomaineBackend> = {
  'Informatique':      'informatique',
  'Génie Civil':       'genie_civil',
  'Génie Électrique':  'electrique',
  'Génie Mécanique':   'mecanique',
  'Chimie':            'chimie',
  'Agronomie':         'agronomie',
  'Finance':           'finance',
  'Management':        'management',
};
const DOMAINE_TO_FIELD: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_TO_DOMAINE).map(([label, key]) => [key, label])
);

// Options de tri disponibles
type SortOption = 'relevance' | 'deadline' | 'tuition_asc' | 'tuition_desc';

export function SearchResults() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [view, setView] = React.useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFields, setSelectedFields] = React.useState<string[]>(() => {
    const d = searchParams.get('domaine');
    return d && DOMAINE_TO_FIELD[d] ? [DOMAINE_TO_FIELD[d]] : [];
  });
  const [selectedLevels, setSelectedLevels] = React.useState<string[]>([]);
  const [tuitionRange, setTuitionRange] = React.useState([0, 100000]);
  const [sortBy, setSortBy] = React.useState<SortOption>('relevance');
  const [page, setPage] = React.useState(1);

  useEffect(() => {
    const d = searchParams.get('domaine');
    setSelectedFields(d && DOMAINE_TO_FIELD[d] ? [DOMAINE_TO_FIELD[d]] : []);
    setPage(1);
  }, [searchParams]);

  // --- Construction des filtres à envoyer au backend ---
  // Règle : toujours undefined (jamais string vide) pour les filtres non actifs.
  // Pour `domaine`, on n'envoie un filtre backend que si exactement 1 champ
  // est coché ET qu'il existe un mapping vers l'enum backend. Sinon on récupère
  // tous les programmes et on filtre côté client (cf. filteredPrograms).
  const filters = useMemo<ProgrammeFilters>(() => ({
    domaine: selectedFields.length === 1
      ? FIELD_TO_DOMAINE[selectedFields[0]]
      : undefined,
    niveau: selectedLevels.length === 1
      ? (selectedLevels[0] as ProgrammeFilters['niveau'])
      : undefined,
    titre: searchQuery.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  }), [selectedFields, selectedLevels, searchQuery, page]);

  const { programs, pagination, loading, error, refetch } = usePrograms(filters);

  // Reset page à 1 dès que les filtres "métier" changent (hors page elle-même).
  useEffect(() => {
    setPage(1);
  }, [selectedFields, selectedLevels, searchQuery]);

  // Si la page courante dépasse `totalPages` (ex: filtres restreints),
  // on revient à la première page.
  useEffect(() => {
    if (pagination && page > pagination.totalPages && pagination.totalPages > 0) {
      setPage(1);
    }
  }, [pagination, page]);

  // --- Filtre tuition côté frontend (le backend n'expose pas ce filtre) ---
  const maxTuition = tuitionRange[1];
  const minTuition = tuitionRange[0];

  const filteredPrograms = useMemo(() => {
    // Garde-fou : tant que l'API n'a pas répondu (ou en cas d'erreur), on travaille sur []
    const safePrograms = Array.isArray(programs) ? programs : [];

    // Filtre par tranche de frais
    let result = safePrograms.filter((p) => {
      const frais = p.frais_inscription ?? 0;
      return frais >= minTuition && frais <= maxTuition;
    });

    // Filtre domaine côté client quand >1 champs cochés (le backend ne prend
    // qu'une valeur).
    if (selectedFields.length > 1) {
      const domainesBackend = selectedFields
        .map((f) => FIELD_TO_DOMAINE[f])
        .filter((d): d is NonNullable<ProgrammeFilters['domaine']> => d !== undefined);
      result = result.filter((p) =>
        p.domaine ? domainesBackend.includes(p.domaine as DomaineBackend) : false
      );
    }

    // Filtre niveau côté client quand >1 niveaux cochés.
    if (selectedLevels.length > 1) {
      result = result.filter((p) => selectedLevels.includes(p.niveau ?? ''));
    }

    return result;
  }, [programs, minTuition, maxTuition, selectedFields, selectedLevels]);

  // --- Tri côté frontend ---
  const sortedPrograms = useMemo(() => {
    const list = [...filteredPrograms];
    switch (sortBy) {
      case 'deadline':
        return list.sort((a, b) =>
          new Date(a.date_limite_candidature ?? '').getTime() -
          new Date(b.date_limite_candidature ?? '').getTime()
        );
      case 'tuition_asc':
        return list.sort((a, b) =>
          (a.frais_inscription ?? 0) - (b.frais_inscription ?? 0)
        );
      case 'tuition_desc':
        return list.sort((a, b) =>
          (b.frais_inscription ?? 0) - (a.frais_inscription ?? 0)
        );
      default:
        return list;
    }
  }, [filteredPrograms, sortBy]);

  // --- Gestion des filtres locaux ---
  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const clearFilters = () => {
    setSelectedFields([]);
    setSelectedLevels([]);
    setTuitionRange([0, 100000]);
    setSearchQuery('');
    setSortBy('relevance');
    setPage(1);
  };

  // Indique si un filtre client-side est actif (tuition restreinte, multi-domaine,
  // multi-niveau) — utile pour afficher un avertissement sur la pagination
  // approximative. La pagination serveur ignore ces filtres.
  const hasClientSideFilter =
    minTuition > 0 ||
    maxTuition < 100000 ||
    selectedFields.length > 1 ||
    selectedLevels.length > 1;

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* Barre de recherche sticky */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] sticky top-[73px] z-40">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--edu-text-tertiary)]" />
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-xl h-12"
              />
            </div>

            {/* Select de tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 rounded-xl border border-input bg-background h-12 min-w-[180px]"
            >
              <option value="relevance">{t('search.sort.relevance')}</option>
              <option value="deadline">{t('search.sort.deadline')}</option>
              <option value="tuition_asc">{t('search.sort.tuitionAsc')}</option>
              <option value="tuition_desc">{t('search.sort.tuitionDesc')}</option>
            </select>

            {/* Bascule grille / liste */}
            <div className="flex items-center gap-2 border border-input rounded-xl p-1">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'list' ? 'bg-[var(--edu-blue)] text-white' : 'text-[var(--edu-text-secondary)]'
                }`}
                aria-label={t('search.view.list')}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'grid' ? 'bg-[var(--edu-blue)] text-white' : 'text-[var(--edu-text-secondary)]'
                }`}
                aria-label={t('search.view.grid')}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar filtres */}
          <aside className="w-[280px] flex-shrink-0 sticky top-[145px] self-start max-h-[calc(100vh-160px)] overflow-y-auto">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-[var(--edu-text-primary)] flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  {t('search.filters.title')}
                </h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  {t('search.filters.reset')}
                </Button>
              </div>

              {/* Domaine */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">{t('search.filters.domain')}</h4>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div key={field.name} className="flex items-center gap-2">
                      <Checkbox
                        id={`field-${field.name}`}
                        checked={selectedFields.includes(field.name)}
                        onCheckedChange={() => toggleField(field.name)}
                      />
                      <label
                        htmlFor={`field-${field.name}`}
                        className="text-sm text-[var(--edu-text-secondary)] cursor-pointer flex-1"
                      >
                        {field.name}
                      </label>
                      <span className="text-xs text-[var(--edu-text-tertiary)]">{field.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--edu-divider)] my-6" />

              {/* Niveau */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">{t('search.filters.level')}</h4>
                <div className="space-y-3">
                  {niveauxBackend.map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={`level-${level}`}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={() => toggleLevel(level)}
                      />
                      <label htmlFor={`level-${level}`} className="text-sm text-[var(--edu-text-secondary)] cursor-pointer">
                        {t(`program.levels.${level}`, { defaultValue: level.replace(/_/g, ' ') })}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--edu-divider)] my-6" />

              {/* Frais d'inscription */}
              <div>
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">{t('search.filters.tuition')}</h4>
                <div className="space-y-4">
                  <Slider
                    min={0}
                    max={100000}
                    step={1000}
                    value={tuitionRange}
                    onValueChange={setTuitionRange}
                    className="mb-2"
                  />
                  <div className="flex items-center justify-between text-xs text-[var(--edu-text-secondary)]">
                    <span>{tuitionRange[0].toLocaleString()} TND</span>
                    <span>{tuitionRange[1].toLocaleString()} TND</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Zone de résultats */}
          <main className="flex-1">
            {/* Compteur de résultats */}
            {!loading && !error && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                  {pagination
                    ? `${pagination.total} ${pagination.total !== 1 ? t('search.results.programs') : t('search.results.program')}`
                    : `${sortedPrograms.length} ${sortedPrograms.length !== 1 ? t('search.results.programs') : t('search.results.program')} ${sortedPrograms.length !== 1 ? t('search.results.foundPlural') : t('search.results.found')}`}
                </h2>
                <p className="text-[var(--edu-text-secondary)]">
                  {selectedFields.length > 0 && (
                    <span>{t('search.results.in')} {selectedFields.join(', ')} </span>
                  )}
                </p>
              </div>
            )}

            {/* État chargement — grille de skeletons */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* État erreur */}
            {error && (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <p className="text-[var(--edu-danger)]">{error}</p>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-[var(--edu-blue)] text-white rounded-lg hover:bg-[var(--edu-blue-hover)] transition-colors"
                >
                  {t('search.results.retry')}
                </button>
              </div>
            )}

            {/* État vide */}
            {!loading && !error && sortedPrograms.length === 0 && (
              <EmptyState
                title={t('search.results.empty')}
                description={t('search.results.emptyDescription')}
                actionLabel={t('search.results.resetFilters')}
                onAction={clearFilters}
              />
            )}

            {/* Liste / grille des programmes */}
            {!loading && !error && sortedPrograms.length > 0 && (
              <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {sortedPrograms.map((programme) => (
                  <ProgramCard key={programme.id} programme={programme} view={view} />
                ))}
              </div>
            )}

            {/* Pagination serveur — branchée sur la meta backend */}
            {!loading && !error && pagination && (
              <>
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  totalItems={pagination.total}
                  itemLabel={t('search.results.program')}
                  disabled={loading}
                />
                {hasClientSideFilter && pagination.totalPages > 1 && (
                  <p className="text-xs text-[var(--edu-text-tertiary)] text-center mt-3 italic">
                    {t('search.results.clientFilterNote')}
                  </p>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
