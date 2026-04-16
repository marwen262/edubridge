import React from 'react';
import { Link } from 'react-router';
import { MapPin, CheckCircle } from 'lucide-react';
import { Institution } from '../data/mockData';
import { motion } from 'motion/react';

interface InstitutionCardProps {
  institution: Institution;
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/institution/${institution.slug}`}>
        <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer">
          <div className="flex items-start gap-4">
            <img
              src={institution.logo}
              alt={institution.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <h3 className="text-lg font-semibold text-[var(--edu-text-primary)] line-clamp-1 flex-1">
                  {institution.name}
                </h3>
                {institution.verified && (
                  <CheckCircle className="w-5 h-5 text-[var(--edu-blue)] flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-1 text-sm text-[var(--edu-text-secondary)] mb-3">
                <MapPin className="w-4 h-4" />
                <span>
                  {institution.city}, {institution.country}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-[var(--edu-text-secondary)]">
                <span className="font-semibold text-[var(--edu-blue)]">
                  {institution.programsCount} programs
                </span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg text-[var(--edu-accent)]">★</span>
                  <span>{institution.rating}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
