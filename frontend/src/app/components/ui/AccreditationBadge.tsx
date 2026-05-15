import React from 'react';

// ---------------------------------------------------------------------------
// Mapping des accréditations utilisées par les instituts privés tunisiens
// (écoles d'ingénieurs + écoles de commerce). Remplacer les SVG placeholders
// dans public/logos/accreditations/ par les logos officiels au besoin.
// ---------------------------------------------------------------------------
// Liste exportée — réutilisée par le formulaire d'édition de profil institut
// pour proposer un multi-select prédéfini (whitelist) au lieu d'un champ libre.
export interface AccreditationInfo {
  code: string;
  logo: string;
  label: string;
  shortLabel: string;
  category: 'engineering' | 'business' | 'higher_ed';
}

export const ACCREDITATIONS_DISPONIBLES: AccreditationInfo[] = [
  // Ingénierie
  {
    code: 'CTI',
    logo: '/logos/accreditations/cti.svg',
    label: "CTI — Commission des Titres d'Ingénieur (France)",
    shortLabel: "Commission des Titres d'Ingénieur",
    category: 'engineering',
  },
  {
    code: 'EUR-ACE',
    logo: '/logos/accreditations/eurace.png',
    label: 'EUR-ACE — European Accreditation of Engineering Programmes',
    shortLabel: 'European Engineering Accreditation',
    category: 'engineering',
  },
  {
    code: 'ABET',
    logo: '/logos/accreditations/abet.svg',
    label: 'ABET — Accreditation Board for Engineering and Technology (USA)',
    shortLabel: 'Engineering & Technology (USA)',
    category: 'engineering',
  },
  // Higher education (multi-domaine)
  {
    code: 'HCERES',
    logo: '/logos/accreditations/hceres.svg',
    label: "HCERES — Haut Conseil de l'évaluation de la recherche et de l'enseignement supérieur (France)",
    shortLabel: 'Évaluation enseignement supérieur (France)',
    category: 'higher_ed',
  },
  // Écoles de commerce
  {
    code: 'AACSB',
    logo: '/logos/accreditations/aacsb.svg.png',
    label: 'AACSB — Association to Advance Collegiate Schools of Business',
    shortLabel: 'Business Schools (USA)',
    category: 'business',
  },
  {
    code: 'EQUIS',
    logo: '/logos/accreditations/equis.svg',
    label: 'EQUIS — EFMD Quality Improvement System',
    shortLabel: 'EFMD Quality Improvement',
    category: 'business',
  },
  {
    code: 'AMBA',
    logo: '/logos/accreditations/amba.svg',
    label: 'AMBA — Association of MBAs',
    shortLabel: 'Association of MBAs',
    category: 'business',
  },
];

// Maps dérivées pour lookup rapide depuis le composant
const accreditationLogos: Record<string, string> = Object.fromEntries(
  ACCREDITATIONS_DISPONIBLES.map((a) => [a.code, a.logo]),
);
const accreditationLabels: Record<string, string> = Object.fromEntries(
  ACCREDITATIONS_DISPONIBLES.map((a) => [a.code, a.label]),
);

const DEFAULT_LOGO = '/logos/accreditations/default.svg';

// Normalisation : supprime tout sauf alphanumérique, met en majuscules
function normaliser(valeur: string): string {
  return valeur.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export interface AccreditationBadgeProps {
  name: string;
  className?: string;
  /**
   * Style du badge selon le contexte :
   * - `default` : fond blanc, pour sections claires (cartes, sections dédiées)
   * - `hero` : verre dépoli sombre, pour fonds image/hero
   */
  variant?: 'default' | 'hero';
}

export function AccreditationBadge({
  name,
  className = '',
  variant = 'default',
}: AccreditationBadgeProps) {
  // Recherche du logo insensible à la casse, espaces et tirets (CTI = c.t.i = c-t-i)
  const cleNormalisee = normaliser(name);
  const cleTrouvee = Object.keys(accreditationLogos).find(
    (key) => normaliser(key) === cleNormalisee,
  );

  const logoSrc = cleTrouvee ? accreditationLogos[cleTrouvee] : DEFAULT_LOGO;
  const tooltipText = cleTrouvee ? accreditationLabels[cleTrouvee] ?? name : name;

  // Styles par variante — base commune + couches spécifiques au contexte
  const baseClasses =
    'group relative inline-flex items-center justify-center h-12 px-3 rounded-lg transition-all duration-200 cursor-default hover:-translate-y-0.5';
  const variantClasses =
    variant === 'hero'
      ? // Glassmorphism sombre — cohérent avec les boutons Save/Share du hero
        'bg-white/15 backdrop-blur-md border border-white/30 shadow-md hover:bg-white/25 hover:border-white/50'
      : // Carte claire — fond blanc, ombre subtile
        'bg-white dark:bg-[#1D1D1F] border border-[var(--edu-border)] shadow-sm hover:shadow-md hover:border-[var(--edu-blue)]/40';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      title={tooltipText}
      role="img"
      aria-label={tooltipText}
    >
      <img
        src={logoSrc}
        alt={name}
        className="h-7 w-auto max-w-[100px] object-contain transition-transform duration-200 group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_LOGO;
        }}
      />
    </div>
  );
}
