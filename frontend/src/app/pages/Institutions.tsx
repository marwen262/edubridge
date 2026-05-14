import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { Badge } from '../components/ui/badge';
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

  // La recherche textuelle est envoyée au serveur (nom + sigle via Op.or).
  // Quand une recherche est active, on charge jusqu'à 100 résultats sans pagination.
  const filters = React.useMemo<InstitutFilters>(() => ({
    page,
    limit: searchQuery.trim() ? 100 : PAGE_SIZE,
    est_verifie: activeFilter === 'verified' ? true : undefined,
    search: searchQuery.trim() || undefined,
  }), [page, activeFilter, searchQuery]);

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

  // Tri local uniquement — la recherche textuelle est déléguée au serveur.
  const filtered = React.useMemo(() => {
    let result = allInstituts;

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
  }, [allInstituts, activeFilter]);

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-b border-[var(--edu-border)]"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--edu-blue) 8%, white) 0%, white 100%)',
        }}
      >
        {/* Motif décoratif dots — identique au Guide */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-30 dark:opacity-10 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="inst-grille-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="var(--edu-blue)" fillOpacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#inst-grille-dots)" />
        </svg>

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 py-12 sm:py-16 z-10">
          {/* Titre + sous-titre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge
              variant="outline"
              className="mb-5 border-[var(--edu-blue)] text-[var(--edu-blue)] bg-white"
            >
              Instituts partenaires
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--edu-text-primary)] mb-4 leading-tight">
              Découvrez nos institutions partenaires
            </h1>
            {!loading && totalInstituts > 0 && (
              <p className="text-lg text-[var(--edu-text-secondary)] max-w-xl mx-auto">
                {totalInstituts} établissement{totalInstituts !== 1 ? 's' : ''} privé
                {totalInstituts !== 1 ? 's' : ''} partenaire{totalInstituts !== 1 ? 's' : ''} en Tunisie
              </p>
            )}
          </motion.div>

          {/* Barre de recherche */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-2xl mx-auto mt-8 mb-10"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--edu-text-tertiary)] pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un établissement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-13 rounded-2xl bg-white border border-[var(--edu-border)] text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--edu-blue)] shadow-md"
            />
          </motion.div>

          {/* ── Filtres — intégrés au hero, segmented-control style ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex justify-center mt-8"
          >
            <div
              className="inline-flex items-center gap-1 rounded-2xl p-1.5"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--edu-border)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              }}
            >
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap"
                  style={
                    activeFilter === f.key
                      ? {
                          background: 'var(--edu-blue)',
                          color: 'white',
                          boxShadow: '0 2px 10px color-mix(in srgb, var(--edu-blue) 40%, transparent)',
                        }
                      : {
                          color: 'var(--edu-text-secondary)',
                          background: 'transparent',
                        }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Contenu ───────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">

        {/* Compteur dynamique */}
        {!loading && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-base font-semibold text-[var(--edu-text-primary)]"
          >
            {filtered.length} établissement{filtered.length !== 1 ? 's' : ''}
            {searchQuery.trim() && (
              <>
                {' '}pour «{' '}
                <span className="text-[var(--edu-blue)]">{searchQuery.trim()}</span>
                {' '}»
              </>
            )}
          </motion.p>
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

        {/* Pagination serveur — masquée quand une recherche est active */}
        {!loading && !error && pagination && !searchQuery.trim() && (
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
