import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { ProgramCard } from '../components/ProgramCard';
import { Button } from '../components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useFavoris } from '@/hooks/useFavoris';

export function MesFavoris() {
  const { user } = useAuth();
  const { favoris, loading, error } = useFavoris();
  const prenom = user?.prenom ?? user?.email?.split('@')[0] ?? 'Candidat';

  const programmes = favoris
    .map((f) => f.programme)
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="candidate"
        user={{ name: prenom, role: user?.role ?? 'candidat' }}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <h1 className="text-2xl font-bold text-[var(--edu-text-primary)]">
            Mes favoris
          </h1>
          <p className="text-sm text-[var(--edu-text-secondary)] mt-0.5">
            {programmes.length > 0
              ? `${programmes.length} programme${programmes.length > 1 ? 's' : ''} sauvegardé${programmes.length > 1 ? 's' : ''}`
              : 'Vos programmes sauvegardés apparaîtront ici'}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-8"
        >
          {error ? (
            <div className="glass-card rounded-2xl py-10 text-center px-6">
              <p className="text-sm text-[var(--edu-danger)]">{error}</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-[var(--edu-surface)]" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-[var(--edu-surface)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--edu-surface)] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : programmes.length === 0 ? (
            <div className="glass-card rounded-2xl py-16 flex flex-col items-center gap-4 text-center px-6">
              <Heart className="w-12 h-12 text-[var(--edu-text-tertiary)]" />
              <div>
                <p className="text-base font-semibold text-[var(--edu-text-primary)]">
                  Aucun programme en favori
                </p>
                <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
                  Cliquez sur le cœur d'un programme pour l'ajouter ici.
                </p>
              </div>
              <Link to="/search">
                <Button className="bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white mt-1">
                  Explorer les programmes
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {programmes.map((programme) => (
                <ProgramCard key={programme.id} programme={programme} view="grid" />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
