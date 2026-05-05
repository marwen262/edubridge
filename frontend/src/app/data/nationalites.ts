// Liste des nationalités acceptées par le formulaire candidature.
// `valeur` = forme stockée en BDD (lowercase, normalisée comme côté backend hook).
// `label` = affichage UI (français, accents conservés).
// `code`  = ISO 3166-1 alpha-2 — utilisé pour les drapeaux emoji et le lien
//           automatique nationalité → indicatif téléphonique.
//
// Décision : pas d'API restcountries.com pour éviter une dépendance runtime
// flaky sur un service tiers. Liste hardcodée, étendable au besoin.
// Tunisie placée en premier (cas par défaut).

export interface Nationalite {
  valeur: string;
  label: string;
  code: string; // ISO 3166-1 alpha-2
}

export const NATIONALITES: ReadonlyArray<Nationalite> = [
  { valeur: 'tunisienne',       label: 'Tunisienne',       code: 'TN' },
  // Maghreb
  { valeur: 'algerienne',       label: 'Algérienne',       code: 'DZ' },
  { valeur: 'marocaine',        label: 'Marocaine',        code: 'MA' },
  { valeur: 'libyenne',         label: 'Libyenne',         code: 'LY' },
  { valeur: 'mauritanienne',    label: 'Mauritanienne',    code: 'MR' },
  // Moyen-Orient
  { valeur: 'egyptienne',       label: 'Égyptienne',       code: 'EG' },
  { valeur: 'libanaise',        label: 'Libanaise',        code: 'LB' },
  { valeur: 'syrienne',         label: 'Syrienne',         code: 'SY' },
  { valeur: 'jordanienne',      label: 'Jordanienne',      code: 'JO' },
  { valeur: 'palestinienne',    label: 'Palestinienne',    code: 'PS' },
  { valeur: 'irakienne',        label: 'Irakienne',        code: 'IQ' },
  { valeur: 'saoudienne',       label: 'Saoudienne',       code: 'SA' },
  { valeur: 'emiratie',         label: 'Émiratie',         code: 'AE' },
  { valeur: 'qatarienne',       label: 'Qatarienne',      code: 'QA' },
  { valeur: 'yemenite',         label: 'Yéménite',         code: 'YE' },
  // Afrique francophone subsaharienne
  { valeur: 'senegalaise',      label: 'Sénégalaise',      code: 'SN' },
  { valeur: 'ivoirienne',       label: 'Ivoirienne',       code: 'CI' },
  { valeur: 'malienne',         label: 'Malienne',         code: 'ML' },
  { valeur: 'burkinabe',        label: 'Burkinabè',        code: 'BF' },
  { valeur: 'nigerienne',       label: 'Nigérienne',       code: 'NE' },
  { valeur: 'guineenne',        label: 'Guinéenne',        code: 'GN' },
  { valeur: 'beninoise',        label: 'Béninoise',        code: 'BJ' },
  { valeur: 'togolaise',        label: 'Togolaise',        code: 'TG' },
  { valeur: 'camerounaise',     label: 'Camerounaise',     code: 'CM' },
  { valeur: 'gabonaise',        label: 'Gabonaise',        code: 'GA' },
  { valeur: 'congolaise',       label: 'Congolaise',       code: 'CG' },
  { valeur: 'tchadienne',       label: 'Tchadienne',       code: 'TD' },
  // Afrique de l'Est
  { valeur: 'ethiopienne',      label: 'Éthiopienne',      code: 'ET' },
  { valeur: 'somalienne',       label: 'Somalienne',       code: 'SO' },
  { valeur: 'soudanaise',       label: 'Soudanaise',       code: 'SD' },
  // Afrique anglophone
  { valeur: 'nigeriane',        label: 'Nigériane',        code: 'NG' },
  { valeur: 'sud_africaine',    label: 'Sud-africaine',    code: 'ZA' },
  { valeur: 'kenyane',          label: 'Kényane',          code: 'KE' },
  { valeur: 'ghaneenne',        label: 'Ghanéenne',        code: 'GH' },
  // Europe
  { valeur: 'francaise',        label: 'Française',        code: 'FR' },
  { valeur: 'belge',            label: 'Belge',            code: 'BE' },
  { valeur: 'suisse',           label: 'Suisse',           code: 'CH' },
  { valeur: 'allemande',        label: 'Allemande',        code: 'DE' },
  { valeur: 'italienne',        label: 'Italienne',        code: 'IT' },
  { valeur: 'espagnole',        label: 'Espagnole',        code: 'ES' },
  { valeur: 'portugaise',       label: 'Portugaise',       code: 'PT' },
  { valeur: 'britannique',      label: 'Britannique',      code: 'GB' },
  { valeur: 'neerlandaise',     label: 'Néerlandaise',     code: 'NL' },
  { valeur: 'roumaine',         label: 'Roumaine',         code: 'RO' },
  { valeur: 'turque',           label: 'Turque',           code: 'TR' },
  // Amériques
  { valeur: 'americaine',       label: 'Américaine',       code: 'US' },
  { valeur: 'canadienne',       label: 'Canadienne',       code: 'CA' },
  { valeur: 'mexicaine',        label: 'Mexicaine',        code: 'MX' },
  { valeur: 'bresilienne',      label: 'Brésilienne',      code: 'BR' },
  { valeur: 'argentine',        label: 'Argentine',        code: 'AR' },
  // Asie
  { valeur: 'chinoise',         label: 'Chinoise',         code: 'CN' },
  { valeur: 'indienne',         label: 'Indienne',         code: 'IN' },
  { valeur: 'pakistanaise',     label: 'Pakistanaise',     code: 'PK' },
  { valeur: 'japonaise',        label: 'Japonaise',        code: 'JP' },
  { valeur: 'coreenne',         label: 'Coréenne',         code: 'KR' },
  { valeur: 'vietnamienne',     label: 'Vietnamienne',     code: 'VN' },
  // Autre
  { valeur: 'autre',            label: 'Autre',            code: 'XX' },
] as const;

export const NATIONALITE_TUNISIENNE = 'tunisienne';

export function estTunisien(valeur: string | null | undefined): boolean {
  return valeur?.toLowerCase().trim() === NATIONALITE_TUNISIENNE;
}

export function trouverLabelNationalite(valeur: string | null | undefined): string {
  if (!valeur) return '';
  const trouvee = NATIONALITES.find((n) => n.valeur === valeur.toLowerCase().trim());
  return trouvee?.label ?? valeur;
}

// ─── Flag emoji ────────────────────────────────────────────────
// Convertit un code ISO alpha-2 en emoji drapeau via les Regional
// Indicator Symbols (U+1F1E6…U+1F1FF). Pas d'API, pas d'image.

export function getFlagEmoji(code: string): string {
  if (!code || code === 'XX') return '🌍';
  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );
}

// ─── Auto-link nationalité → indicatif ─────────────────────────
// Mapping exhaustif valeur → dial code. Utilisé dans MultiStepDialog
// pour pré-remplir l'indicatif téléphonique quand la nationalité change.

const NATIONALITE_VERS_INDICATIF: Record<string, string> = {
  tunisienne:       '+216',
  algerienne:       '+213',
  marocaine:        '+212',
  libyenne:         '+218',
  mauritanienne:    '+222',
  egyptienne:       '+20',
  libanaise:        '+961',
  syrienne:         '+963',
  jordanienne:      '+962',
  palestinienne:    '+970',
  irakienne:        '+964',
  saoudienne:       '+966',
  emiratie:         '+971',
  qatarienne:       '+974',
  yemenite:         '+967',
  senegalaise:      '+221',
  ivoirienne:       '+225',
  malienne:         '+223',
  burkinabe:        '+226',
  nigerienne:       '+227',
  guineenne:        '+224',
  beninoise:        '+229',
  togolaise:        '+228',
  camerounaise:     '+237',
  gabonaise:        '+241',
  congolaise:       '+242',
  tchadienne:       '+235',
  ethiopienne:      '+251',
  somalienne:       '+252',
  soudanaise:       '+249',
  nigeriane:        '+234',
  sud_africaine:    '+27',
  kenyane:          '+254',
  ghaneenne:        '+233',
  francaise:        '+33',
  belge:            '+32',
  suisse:           '+41',
  allemande:        '+49',
  italienne:        '+39',
  espagnole:        '+34',
  portugaise:       '+351',
  britannique:      '+44',
  neerlandaise:     '+31',
  roumaine:         '+40',
  turque:           '+90',
  americaine:       '+1',
  canadienne:       '+1',
  mexicaine:        '+52',
  bresilienne:      '+55',
  argentine:        '+54',
  chinoise:         '+86',
  indienne:         '+91',
  pakistanaise:     '+92',
  japonaise:        '+81',
  coreenne:         '+82',
  vietnamienne:     '+84',
};

export function getIndicatifByNationalite(valeur: string | null | undefined): string {
  if (!valeur) return '+216';
  return NATIONALITE_VERS_INDICATIF[valeur.toLowerCase().trim()] ?? '+216';
}
