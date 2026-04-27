import React from 'react';
import { Link, useNavigate } from 'react-router';
import { MapPin, CheckCircle } from 'lucide-react';
import type { Institut } from '@/types/api';
import { motion } from 'motion/react';

interface InstitutionCardProps {
  institution: Institut;
}

/** Calcule les initiales à partir du nom : max 2 mots, première lettre de chacun.
 *  "École Polytechnique" → "EP"  |  "MIT" → "M"
 */
function getInitials(nom: string): string {
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  const navigate = useNavigate();
  const [logoError, setLogoError] = React.useState(false);

  const localisation = [institution.adresse?.ville, institution.adresse?.pays]
    .filter(Boolean)
    .join(', ');

  const showLogo = !!institution.logo && !logoError;
  const initials = getInitials(institution.nom ?? '');

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/institution/${institution.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/institution/${institution.id}`}>
        <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer flex flex-col gap-4">
          {/* En-tête : logo / avatar + nom */}
          <div className="flex items-start gap-4">
            {/* Logo avec fallback initiales */}
            {showLogo ? (
              <img
                src={institution.logo}
                alt={institution.nom}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--edu-blue)' }}
              >
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Nom + badge vérifié */}
              <div className="flex items-start gap-2 mb-2">
                <h3 className="text-lg font-semibold text-[var(--edu-text-primary)] line-clamp-1 flex-1">
                  {institution.nom}
                </h3>
                {institution.est_verifie && (
                  <CheckCircle className="w-5 h-5 text-[var(--edu-blue)] flex-shrink-0 mt-0.5" />
                )}
              </div>

              {/* Localisation */}
              {localisation && (
                <div className="flex items-center gap-1 text-sm text-[var(--edu-text-secondary)] mb-3">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="line-clamp-1">{localisation}</span>
                </div>
              )}

              {/* Stats : programmes + note */}
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
                    <span className="text-base text-[var(--edu-accent)]">★</span>
                    <span>{institution.note}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bouton Voir détails */}
          <button
            onClick={handleViewDetails}
            className="w-full mt-auto py-2 px-4 rounded-full text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--edu-blue)' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--edu-blue-hover)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--edu-blue)')
            }
          >
            Voir détails
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
