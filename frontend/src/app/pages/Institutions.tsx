import React from 'react';
import { Search } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SkeletonCard } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { InstitutCard } from '../components/InstitutCard';
import { Pagination } from '../components/Pagination';
import { useInstituts } from '@/hooks/useInstituts';
import { usePrograms } from '@/hooks/usePrograms';
import type { Institut, InstitutFilters } from '@/types/api';

// Taille de page côté serveur. Le filtrage local (recherche par nom, tri par
// note ou nb de programmes) s'applique sur la page courante uniquement.
const PAGE_SIZE = 12;

// ── Types ────────────────────────────────────────────────────
type FilterKey = 'all' | 'verified' | 'top_rated' | 'most_programs';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',           label: 'Tous' },
  { key: 'verified',      label: 'Vérifiés ✓' },
  { key: 'top_rated',     label: 'Mieux notés ⭐' },
  { key: 'most_programs', label: 'Plus de programmes' },
];

// ── Page principale ──────────────────────────────────────────
export function Institutions() {
  const [searchQuery,  setSearchQuery]  = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>('all');
  const [page, setPage] = React.useState(1);

  // Filtres serveur : pagination + filtre `est_verifie` quand l'onglet "Vérifiés"
  // est actif (les autres tris restent côté client sur la page courante).
  const filters = React.useMemo<InstitutFilters>(() => ({
    page,
    limit: PAGE_SIZE,
    est_verifie: activeFilter === 'verified' ? true : undefined,
  }), [page, activeFilter]);

  const { instituts, pagination, loading, error, refetch } = useInstituts(filters);
  // `usePrograms()` sert uniquement au compteur du hero — `pagination.total` du
  // backend est la source de vérité.
  const { pagination: progPagination } = usePrograms();

  const allInstituts = (instituts as Institut[]).filter(Boolean);

  // Reset page à 1 quand on change l'onglet ou la recherche
  React.useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  // Stats hero — on s'appuie sur la meta backend pour les totaux globaux.
  const totalInstituts = pagination?.total ?? allInstituts.length;
  const totalProgrammes = progPagination?.total ?? 0;
  const verifiedCount   = allInstituts.filter((i) => i.est_verifie).length;
  const verifiedPct     = allInstituts.length > 0
    ? Math.round((verifiedCount / allInstituts.length) * 100)
    : 0;

  // Filtrage + tri local
  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let result = q
      ? allInstituts.filter((i) => i.nom?.toLowerCase().includes(q))
      : allInstituts;

    switch (activeFilter) {
      case 'verified':
        result = result.filter((i) => i.est_verifie);
        break;
      case 'top_rated':
        result = [...result].sort((a, b) => (b.note ?? 0) - (a.note ?? 0));
        break;
      case 'most_programs':
        result = [...result].sort(
          (a, b) => (b.programmes?.length ?? 0) - (a.programmes?.length ?? 0),
        );
        break;
    }

    return result;
  }, [allInstituts, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative py-16 px-4 sm:px-6 bg-[var(--edu-surface)] border-b border-[var(--edu-border)]">
        <div className="absolute inset-0 dotted-bg opacity-40 mix-blend-multiply dark:mix-blend-overlay" />
        <div className="relative max-w-[1440px] mx-auto text-center z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--edu-text-primary)] mb-3">
            Découvrez nos institutions partenaires
          </h1>

          {!loading && totalInstituts > 0 && (
            <p className="mb-8 text-base text-[var(--edu-text-secondary)]">
              {totalInstituts} établissement
              {totalInstituts !== 1 ? 's' : ''} privé
              {totalInstituts !== 1 ? 's' : ''} partenaire
              {totalInstituts !== 1 ? 's' : ''} en Tunisie
            </p>
          )}

          {/* Barre de recherche */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--edu-text-tertiary)] pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un établissement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-12 rounded-xl bg-white dark:bg-[#1D1D1F] border border-[var(--edu-border)] text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--edu-blue)] shadow-sm"
            />
          </div>

          {/* Stat chips dynamiques */}
          {!loading && totalInstituts > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {[
                `${totalInstituts} Institution${totalInstituts !== 1 ? 's' : ''}`,
                `${totalProgrammes} Programme${totalProgrammes !== 1 ? 's' : ''}`,
                `${verifiedPct}% Vérifiés`,
              ].map((label) => (
                <span
                  key={label}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-[var(--edu-blue)] bg-[var(--edu-blue)]/10"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Barre de filtres ──────────────────────────────────── */}
      <div
        className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] sticky top-[73px] z-30"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={
                activeFilter === f.key
                  ? { background: 'var(--edu-blue)', color: 'white' }
                  : { background: 'var(--edu-surface)', color: 'var(--edu-text-secondary)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ───────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">

        {/* Compteur dynamique */}
        {!loading && !error && (
          <p
            className="mb-6"
            style={{ fontWeight: 600, color: 'var(--edu-text-primary)' }}
          >
            {filtered.length} établissement{filtered.length !== 1 ? 's' : ''}
            {searchQuery.trim() && (
              <>
                {' '}pour «{' '}
                <span style={{ color: 'var(--edu-blue)' }}>{searchQuery.trim()}</span>
                {' '}»
              </>
            )}
          </p>
        )}

        {/* Loading — 3 squelettes */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 24,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <p className="text-[var(--edu-danger)]">{error}</p>
            <button
              onClick={refetch}
              className="px-5 py-2 text-white rounded-full"
              style={{ background: 'var(--edu-blue)' }}
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title={
              searchQuery.trim()
                ? `Aucun établissement trouvé pour "${searchQuery.trim()}"`
                : 'Aucun établissement disponible'
            }
            description={
              searchQuery.trim()
                ? 'Essayez un autre terme de recherche ou réinitialisez les filtres.'
                : 'Aucun établissement disponible pour le moment.'
            }
            actionLabel={searchQuery.trim() ? 'Réinitialiser la recherche' : undefined}
            onAction={searchQuery.trim() ? () => setSearchQuery('') : undefined}
          />
        )}

        {/* Grille repeat(auto-fill, minmax(340px, 1fr)) */}
        {!loading && !error && filtered.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 24,
            }}
          >
            {filtered.map((inst) => (
              <InstitutCard key={inst.id} institut={inst as Institut} />
            ))}
          </div>
        )}

        {/* Pagination serveur */}
        {!loading && !error && pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            totalItems={pagination.total}
            itemLabel="institut"
            disabled={loading}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
