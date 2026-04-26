import React from 'react';
import { CheckCircle, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Institut } from '@/types/api';
import { motion } from 'motion/react';

function getInitials(nom: string): string {
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function InstitutCard({ institut }: { institut: Institut }) {
  const navigate = useNavigate();
  const [logoError, setLogoError] = React.useState(false);

  const initials     = getInitials(institut.nom ?? '');
  const coverSrc     = institut.image_couverture ?? institut.logo;
  const localisation = [institut.adresse?.ville, institut.adresse?.pays]
    .filter(Boolean)
    .join(', ');
  const progCount    = institut.programmes?.length;
  const firstAccred  = institut.accreditations?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="glass-card rounded-2xl overflow-hidden hover-lift cursor-pointer flex flex-col h-full"
        onClick={() => navigate(`/institution/${institut.id}`)}
      >
        {/* Bannière 150px */}
        <div className="relative flex-shrink-0" style={{ height: 150 }}>
          <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={institut.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full hero-gradient" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

          {/* Logo / initiales chevauchant en bas */}
          <div className="absolute bottom-[-22px] left-4 z-10">
            {institut.logo && !logoError ? (
              <img
                src={institut.logo}
                alt={institut.nom}
                className="w-[60px] h-[60px] rounded-xl object-cover border-2 border-white shadow-md"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-[60px] h-[60px] rounded-xl flex items-center justify-center font-bold text-white text-xl border-2 border-white shadow-md"
                style={{ backgroundColor: 'var(--edu-blue)' }}
              >
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Corps */}
        <div className="pt-8 px-4 pb-4 flex flex-col flex-1">
          {/* Nom + badge vérifié */}
          <div className="flex items-start gap-2 mb-1">
            <h3 className="text-base font-semibold text-[var(--edu-text-primary)] line-clamp-2 flex-1 leading-snug">
              {institut.nom}
            </h3>
            {institut.est_verifie && (
              <CheckCircle className="w-5 h-5 text-[var(--edu-blue)] flex-shrink-0 mt-0.5" />
            )}
          </div>

          {/* Sigle + localisation */}
          <div className="flex items-center gap-1 text-xs text-[var(--edu-text-secondary)] mb-4 flex-wrap">
            {institut.sigle && (
              <span className="font-medium">({institut.sigle})</span>
            )}
            {institut.sigle && localisation && <span>•</span>}
            {localisation && (
              <>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="line-clamp-1">{localisation}</span>
              </>
            )}
          </div>

          {/* 3 mini stat cards */}
          <div className="flex gap-2 mb-4">
            {progCount != null && (
              <div
                className="flex-1 flex flex-col items-center rounded-xl py-2 px-1"
                style={{ background: 'var(--edu-surface)' }}
              >
                <span className="font-bold text-[var(--edu-blue)] leading-tight" style={{ fontSize: '1.1rem' }}>
                  {progCount}
                </span>
                <span className="text-[var(--edu-text-secondary)] mt-0.5 text-center" style={{ fontSize: '0.65rem' }}>
                  Prog.
                </span>
              </div>
            )}
            {institut.note != null && (
              <div
                className="flex-1 flex flex-col items-center rounded-xl py-2 px-1"
                style={{ background: 'var(--edu-surface)' }}
              >
                <span className="font-bold text-[var(--edu-blue)] leading-tight" style={{ fontSize: '1.1rem' }}>
                  {institut.note}
                </span>
                <span className="text-[var(--edu-text-secondary)] mt-0.5" style={{ fontSize: '0.65rem' }}>
                  ⭐ Note
                </span>
              </div>
            )}
            {firstAccred && (
              <div
                className="flex-1 flex flex-col items-center rounded-xl py-2 px-1 overflow-hidden"
                style={{ background: 'var(--edu-surface)' }}
              >
                <span
                  className="font-bold text-[var(--edu-blue)] leading-tight truncate w-full text-center"
                  style={{ fontSize: '1.1rem' }}
                >
                  {firstAccred}
                </span>
                <span className="text-[var(--edu-text-secondary)] mt-0.5" style={{ fontSize: '0.65rem' }}>
                  Accréd.
                </span>
              </div>
            )}
          </div>

          {/* Description 2 lignes */}
          {institut.description && (
            <p className="text-xs text-[var(--edu-text-secondary)] mb-4 line-clamp-2 flex-1">
              {institut.description}
            </p>
          )}

          {/* Voir détails */}
          <button
            className="mt-auto flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
            style={{ color: 'var(--edu-blue)' }}
          >
            Voir détails
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
