import React from 'react';
import { Link } from 'react-router';
import { MapPin, CheckCircle } from 'lucide-react';
import type { Institut } from '@/types/api';
import { motion } from 'motion/react';

interface InstitutionCardProps {
  institution: Institut;
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  const localisation = [institution.adresse?.ville, institution.adresse?.pays]
    .filter(Boolean)
    .join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/institution/${institution.id}`}>
        <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer">
          <div className="flex items-start gap-4">
            {institution.logo ? (
              <img
                src={institution.logo}
                alt={institution.nom}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[var(--edu-blue)]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-[var(--edu-blue)]">
                  {institution.nom.charAt(0)}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <h3 className="text-lg font-semibold text-[var(--edu-text-primary)] line-clamp-1 flex-1">
                  {institution.nom}
                </h3>
                {institution.est_verifie && (
                  <CheckCircle className="w-5 h-5 text-[var(--edu-blue)] flex-shrink-0" />
                )}
              </div>

              {localisation && (
                <div className="flex items-center gap-1 text-sm text-[var(--edu-text-secondary)] mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{localisation}</span>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-[var(--edu-text-secondary)]">
                {institution.programmes != null && (
                  <>
                    <span className="font-semibold text-[var(--edu-blue)]">
                      {institution.programmes.length} programme
                      {institution.programmes.length !== 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                  </>
                )}
                {institution.note != null && (
                  <div className="flex items-center gap-1">
                    <span className="text-lg text-[var(--edu-accent)]">★</span>
                    <span>{institution.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
