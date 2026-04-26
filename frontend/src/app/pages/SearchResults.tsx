import React, { useMemo } from 'react';
import { Search, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { EmptyState } from '../components/EmptyState';
import { SkeletonCard } from '../components/SkeletonCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { fields, countries } from '../data/staticData';
import { usePrograms } from '@/hooks/usePrograms';
import type { ProgrammeFilters } from '@/types/api';

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

// Options de tri disponibles
type SortOption = 'relevance' | 'deadline' | 'tuition_asc' | 'tuition_desc';

export function SearchResults() {
  const [view, setView] = React.useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = React.useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([]);
  const [tuitionRange, setTuitionRange] = React.useState([0, 100000]);
  const [sortBy, setSortBy] = React.useState<SortOption>('relevance');

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
  }), [selectedFields, selectedLevels, searchQuery]);

  const { programs, loading, error, refetch } = usePrograms(filters);

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

    // Filtre pays côté frontend (le backend n'expose pas ce filtre)
    if (selectedCountries.length > 0) {
      result = result.filter((p) =>
        selectedCountries.includes(p.institut?.adresse?.pays ?? '')
      );
    }

    return result;
  }, [programs, minTuition, maxTuition, selectedCountries, selectedFields, selectedLevels]);

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

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  };

  const clearFilters = () => {
    setSelectedFields([]);
    setSelectedLevels([]);
    setSelectedCountries([]);
    setTuitionRange([0, 100000]);
    setSearchQuery('');
    setSortBy('relevance');
  };

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
                placeholder="Rechercher des programmes..."
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
              <option value="relevance">Pertinence</option>
              <option value="deadline">Date limite</option>
              <option value="tuition_asc">Frais (croissant)</option>
              <option value="tuition_desc">Frais (décroissant)</option>
            </select>

            {/* Bascule grille / liste */}
            <div className="flex items-center gap-2 border border-input rounded-xl p-1">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'list' ? 'bg-[var(--edu-blue)] text-white' : 'text-[var(--edu-text-secondary)]'
                }`}
                aria-label="Vue liste"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'grid' ? 'bg-[var(--edu-blue)] text-white' : 'text-[var(--edu-text-secondary)]'
                }`}
                aria-label="Vue grille"
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
          <aside className="w-[280px] flex-shrink-0 sticky top-[145px] self-start">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-[var(--edu-text-primary)] flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filtres
                </h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Réinitialiser
                </Button>
              </div>

              {/* Domaine */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Domaine</h4>
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
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Niveau</h4>
                <div className="space-y-3">
                  {niveauxBackend.map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={`level-${level}`}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={() => toggleLevel(level)}
                      />
                      <label htmlFor={`level-${level}`} className="text-sm text-[var(--edu-text-secondary)] cursor-pointer">
                        {level.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--edu-divider)] my-6" />

              {/* Pays */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Pays</h4>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {countries.slice(0, 6).map((country) => (
                    <div key={country} className="flex items-center gap-2">
                      <Checkbox
                        id={`country-${country}`}
                        checked={selectedCountries.includes(country)}
                        onCheckedChange={() => toggleCountry(country)}
                      />
                      <label htmlFor={`country-${country}`} className="text-sm text-[var(--edu-text-secondary)] cursor-pointer">
                        {country}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--edu-divider)] my-6" />

              {/* Frais d'inscription */}
              <div>
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Frais d'inscription</h4>
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
                  {sortedPrograms.length} programme{sortedPrograms.length !== 1 ? 's' : ''} trouvé{sortedPrograms.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-[var(--edu-text-secondary)]">
                  {selectedFields.length > 0 && (
                    <span>dans {selectedFields.join(', ')} </span>
                  )}
                  {selectedCountries.length > 0 && (
                    <span>depuis {selectedCountries.join(', ')}</span>
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
                  Réessayer
                </button>
              </div>
            )}

            {/* État vide */}
            {!loading && !error && sortedPrograms.length === 0 && (
              <EmptyState
                title="Aucun programme trouvé"
                description="Essayez d'ajuster vos filtres ou votre recherche pour trouver plus de programmes."
                actionLabel="Réinitialiser les filtres"
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

            {/* Pagination (statique, à brancher en étape suivante) */}
            {!loading && !error && sortedPrograms.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button variant="outline" disabled className="rounded-full">
                  Précédent
                </Button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <Button
                    key={page}
                    variant={page === 1 ? 'default' : 'outline'}
                    className={`rounded-full w-10 h-10 p-0 ${
                      page === 1 ? 'bg-[var(--edu-blue)] text-white' : ''
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                <Button variant="outline" className="rounded-full">
                  Suivant
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
