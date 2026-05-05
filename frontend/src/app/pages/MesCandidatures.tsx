import { motion } from 'motion/react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { ListeCandidatures } from '../components/candidatures/ListeCandidatures';
import { useAuth } from '@/context/AuthContext';

export function MesCandidatures() {
  const { user } = useAuth();
  const prenom = user?.prenom ?? user?.email?.split('@')[0] ?? 'Candidat';

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="candidate"
        user={{ name: prenom, role: user?.role ?? 'candidat' }}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <h1 className="text-2xl font-bold text-[var(--edu-text-primary)]">
            Mes candidatures
          </h1>
          <p className="text-sm text-[var(--edu-text-secondary)] mt-0.5">
            Suivez l'état de toutes vos candidatures
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-8"
        >
          <ListeCandidatures />
        </motion.div>
      </main>
    </div>
  );
}
