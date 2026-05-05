// Indicatifs téléphoniques internationaux affichés dans le composant
// IndicatifTelephone. Liste hardcodée (pas de libphonenumber-js — trop lourd
// pour ce besoin MVP, ~145kB minifié).
//
// Décision : on stocke le numéro complet en BDD au format E.164 sans espaces
// (ex: '+21698765432') ; le composant gère la séparation indicatif/numéro
// pour la saisie uniquement.

export interface Indicatif {
  code: string;       // ex: '+216'
  pays: string;       // label affiché à côté
  iso: string;        // ISO 3166-1 alpha-2 — key React + lien vers nationalités
}

export const INDICATIFS: ReadonlyArray<Indicatif> = [
  // Maghreb
  { code: '+216', pays: 'Tunisie',              iso: 'TN' },
  { code: '+213', pays: 'Algérie',              iso: 'DZ' },
  { code: '+212', pays: 'Maroc',                iso: 'MA' },
  { code: '+218', pays: 'Libye',                iso: 'LY' },
  { code: '+222', pays: 'Mauritanie',           iso: 'MR' },
  // Moyen-Orient
  { code: '+20',  pays: 'Égypte',               iso: 'EG' },
  { code: '+961', pays: 'Liban',                iso: 'LB' },
  { code: '+963', pays: 'Syrie',                iso: 'SY' },
  { code: '+962', pays: 'Jordanie',             iso: 'JO' },
  { code: '+970', pays: 'Palestine',            iso: 'PS' },
  { code: '+964', pays: 'Irak',                 iso: 'IQ' },
  { code: '+966', pays: 'Arabie saoudite',      iso: 'SA' },
  { code: '+971', pays: 'Émirats AU',           iso: 'AE' },
  { code: '+974', pays: 'Qatar',                iso: 'QA' },
  { code: '+967', pays: 'Yémen',                iso: 'YE' },
  // Afrique subsaharienne
  { code: '+221', pays: 'Sénégal',              iso: 'SN' },
  { code: '+225', pays: 'Côte d\'Ivoire',       iso: 'CI' },
  { code: '+223', pays: 'Mali',                 iso: 'ML' },
  { code: '+226', pays: 'Burkina Faso',         iso: 'BF' },
  { code: '+227', pays: 'Niger',                iso: 'NE' },
  { code: '+224', pays: 'Guinée',               iso: 'GN' },
  { code: '+229', pays: 'Bénin',                iso: 'BJ' },
  { code: '+228', pays: 'Togo',                 iso: 'TG' },
  { code: '+237', pays: 'Cameroun',             iso: 'CM' },
  { code: '+241', pays: 'Gabon',                iso: 'GA' },
  { code: '+242', pays: 'Congo',                iso: 'CG' },
  { code: '+235', pays: 'Tchad',                iso: 'TD' },
  { code: '+251', pays: 'Éthiopie',             iso: 'ET' },
  { code: '+252', pays: 'Somalie',              iso: 'SO' },
  { code: '+249', pays: 'Soudan',               iso: 'SD' },
  { code: '+234', pays: 'Nigeria',              iso: 'NG' },
  { code: '+27',  pays: 'Afrique du Sud',       iso: 'ZA' },
  { code: '+254', pays: 'Kenya',                iso: 'KE' },
  { code: '+233', pays: 'Ghana',                iso: 'GH' },
  // Europe
  { code: '+33',  pays: 'France',               iso: 'FR' },
  { code: '+32',  pays: 'Belgique',             iso: 'BE' },
  { code: '+41',  pays: 'Suisse',               iso: 'CH' },
  { code: '+49',  pays: 'Allemagne',            iso: 'DE' },
  { code: '+39',  pays: 'Italie',               iso: 'IT' },
  { code: '+34',  pays: 'Espagne',              iso: 'ES' },
  { code: '+351', pays: 'Portugal',             iso: 'PT' },
  { code: '+44',  pays: 'Royaume-Uni',          iso: 'GB' },
  { code: '+31',  pays: 'Pays-Bas',             iso: 'NL' },
  { code: '+40',  pays: 'Roumanie',             iso: 'RO' },
  { code: '+90',  pays: 'Turquie',              iso: 'TR' },
  // Amériques
  { code: '+1',   pays: 'États-Unis',           iso: 'US' },
  { code: '+1',   pays: 'Canada',               iso: 'CA' },
  { code: '+52',  pays: 'Mexique',              iso: 'MX' },
  { code: '+55',  pays: 'Brésil',               iso: 'BR' },
  { code: '+54',  pays: 'Argentine',            iso: 'AR' },
  // Asie
  { code: '+86',  pays: 'Chine',                iso: 'CN' },
  { code: '+91',  pays: 'Inde',                 iso: 'IN' },
  { code: '+92',  pays: 'Pakistan',             iso: 'PK' },
  { code: '+81',  pays: 'Japon',                iso: 'JP' },
  { code: '+82',  pays: 'Corée du Sud',         iso: 'KR' },
  { code: '+84',  pays: 'Vietnam',              iso: 'VN' },
] as const;

export const INDICATIF_DEFAUT = '+216';

// Sépare un numéro complet '+216 98 765 432' en { indicatif, numero }.
// Stratégie best-effort : matche le préfixe le plus long de la liste.
// Si aucun match, retourne indicatif=DEFAUT et numéro brut.
export function decomposerTelephone(complet: string | null | undefined): {
  indicatif: string;
  numero: string;
} {
  if (!complet) return { indicatif: INDICATIF_DEFAUT, numero: '' };
  const sansEspaces = complet.replace(/\s+/g, '');
  // On trie par longueur décroissante pour matcher '+216' avant '+2'
  const codes = [...new Set(INDICATIFS.map((i) => i.code))].sort(
    (a, b) => b.length - a.length,
  );
  for (const code of codes) {
    if (sansEspaces.startsWith(code)) {
      return { indicatif: code, numero: sansEspaces.slice(code.length) };
    }
  }
  return { indicatif: INDICATIF_DEFAUT, numero: sansEspaces };
}

// Reconstitue un numéro stockable depuis le couple (indicatif, numero saisi).
// Conserve l'indicatif seul lorsque le numéro est vide afin que le Select
// reste sur le pays choisi entre deux saisies.
export function composerTelephone(indicatif: string, numero: string): string {
  const num = numero.replace(/\s+/g, '');
  if (!indicatif && !num) return '';
  return `${indicatif}${num}`;
}
