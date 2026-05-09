import React from 'react';

// Mapping des accréditations vers leurs logos respectifs
const accreditationLogos: Record<string, string> = {
  'ABET': '/logos/accreditations/abet.jpg',
  'AACSB': '/logos/accreditations/aacsb.svg.png',
  'EUR-ACE': '/logos/accreditations/eurace.png',
  'EURACE': '/logos/accreditations/eurace.png',
  'CTI': '/logos/accreditations/default.svg', // Ajoutez d'autres logos réels au fur et à mesure
};

const DEFAULT_LOGO = '/logos/accreditations/default.svg';

export interface AccreditationBadgeProps {
  name: string;
  className?: string;
}

export function AccreditationBadge({ name, className = '' }: AccreditationBadgeProps) {
  // Recherche du logo insensible à la casse et aux espaces/tirets
  const normalizedKey = Object.keys(accreditationLogos).find(
    (key) => key.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  );
  
  const logoSrc = normalizedKey ? accreditationLogos[normalizedKey] : DEFAULT_LOGO;

  return (
    <div
      className={`group relative inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1D1D1F] border border-[var(--edu-border)] shadow-sm hover:shadow-md hover:border-[var(--edu-blue)]/30 transition-all duration-300 cursor-default overflow-hidden ${className}`}
      title={`Accréditation: ${name}`}
    >
      <img
        src={logoSrc}
        alt={`Logo ${name}`}
        className="h-5 w-auto object-contain filter grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_LOGO;
        }}
      />
      <span className="text-sm font-semibold text-[var(--edu-text-primary)] group-hover:text-[var(--edu-blue)] transition-colors duration-300">
        {name}
      </span>
    </div>
  );
}
