import { motion } from 'motion/react';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
  description: string;
}

export function InstitutionPlaceholderSection({ title, subtitle, description }: Props) {
  return (
    <div>
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">Établissement</p>
        <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">{title}</h1>
        <p className="text-sm text-[var(--edu-text-secondary)] mt-1">{subtitle}</p>
      </div>
      <div className="p-8 max-w-[1600px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--edu-indigo)15' }}>
            <Construction className="w-8 h-8" style={{ color: 'var(--edu-indigo)' }} />
          </div>
          <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-2">{title}</h2>
          <p className="text-sm text-[var(--edu-text-secondary)] max-w-lg mx-auto leading-relaxed">{description}</p>
          <div className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] bg-[var(--edu-surface)] px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[var(--edu-warning)] animate-pulse" />
            En cours de développement
          </div>
        </motion.div>
      </div>
    </div>
  );
}
