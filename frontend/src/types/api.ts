// Types basés sur les modèles Sequelize du backend (backend.md §5)

// --- Sous-types utilitaires ---

export interface Adresse {
  rue?: string;
  ville?: string;
  gouvernorat?: string;
  code_postal?: string;
  pays?: string;
  lien_maps?: string;
}

export interface Contact {
  telephone?: string;
  email?: string;
  fax?: string;
}

export interface DocumentRequis {
  nom: string;
  obligatoire: boolean;
}

export interface Prerequis {
  moyenne_min?: number;
  matieres?: string[];
  types_bac?: string[];
}

export interface DocumentSoumis {
  nom: string;
  url: string;
  media_id: string;
  telecharge_le: string;
}

export interface ParcoursAcademique {
  diplome: string;
  etablissement: string;
  annee: number;
  mention?: string;
}

// --- Entités backend ---

/** Résumé d'un institut inclus dans les réponses /api/programmes */
export interface InstitutResume {
  id: string;
  nom: string;
  sigle?: string;
  logo?: string;
  adresse?: Adresse;
  est_verifie?: boolean;
  note?: number;
  image_couverture?: string;
  taux_acceptation?: number;
  nombre_etudiants?: number;
  accreditations?: string[];
}

/** Programme complet tel que retourné par /api/programmes */
export interface Programme {
  id: string;
  institut_id: string;
  titre: string;
  domaine?: string;
  niveau?: string;
  mode?: string;
  duree_annees?: number;
  description?: string;
  documents_requis?: DocumentRequis[];
  prerequis?: Prerequis;
  frais_inscription?: number;
  date_limite_candidature?: string;
  date_debut?: string;
  capacite?: number;
  est_actif?: boolean;
  langue?: string;
  cree_le?: string;
  mis_a_jour_le?: string;
  /** Institut lié (inclus via association Sequelize) */
  institut?: InstitutResume;
}

export type ValidationStatus =
  | 'invited'
  | 'pending_admin_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

/** Institut complet tel que retourné par /api/instituts */
export interface Institut {
  id: string;
  utilisateur_id: string;
  nom: string | null;
  sigle?: string;
  description?: string;
  site_web?: string;
  logo?: string;
  adresse?: Adresse;
  accreditations?: string[];
  contact?: Contact;
  est_verifie?: boolean;
  note?: number;
  image_couverture?: string;
  taux_acceptation?: number;
  nombre_etudiants?: number;
  validation_status?: ValidationStatus;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  cree_le?: string;
  mis_a_jour_le?: string;
  /** Programmes publiés par l'institut */
  programmes?: Programme[];
  /** Utilisateur lié (inclus dans les réponses admin) */
  utilisateur?: {
    id: string;
    email: string;
    cree_le?: string;
    first_login_completed?: boolean;
  };
}

// --- Auth ---

export interface RegisterData {
  email: string;
  password: string;
  role: 'candidat' | 'institut' | 'admin';
  // Champs profil candidat
  prenom?: string;
  nom?: string;
  telephone?: string;
  nationalite?: string;
  // Champs profil institut
  sigle?: string;
  description?: string;
  site_web?: string;
}

// --- Pagination ---

/** Meta pagination renvoyée par les listings backend (cf. utils/pagination.js) */
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Filtres communs de pagination acceptés par tous les listings paginés */
export interface PaginationFilters {
  page?: number;
  /** Max 100 côté backend */
  limit?: number;
}

// --- Filtres ---

export interface ProgrammeFilters extends PaginationFilters {
  domaine?: 'informatique' | 'genie_civil' | 'electrique' | 'mecanique' | 'chimie' | 'agronomie' | 'finance' | 'management';
  niveau?: 'cycle_preparatoire' | 'licence' | 'master' | 'ingenieur';
  mode?: 'cours_du_jour' | 'cours_du_soir' | 'alternance' | 'formation_continue';
  institut_id?: string;
  est_actif?: boolean | 'all';
  titre?: string;
}

export interface InstitutFilters extends PaginationFilters {
  nom?: string;
  search?: string;
  est_verifie?: boolean;
  admin_view?: boolean;
}

export interface CandidatureFilters extends PaginationFilters {
  statut?: 'brouillon' | 'soumise' | 'en_examen' | 'acceptee' | 'refusee' | 'liste_attente';
  programme_id?: string;
}

// --- Programmes ---

export interface CreateProgrammeData {
  institut_id: string;
  titre: string;
  domaine?: 'informatique' | 'genie_civil' | 'electrique' | 'mecanique' | 'chimie' | 'agronomie' | 'finance' | 'management';
  niveau?: 'cycle_preparatoire' | 'licence' | 'master' | 'ingenieur';
  mode?: 'cours_du_jour' | 'cours_du_soir' | 'alternance' | 'formation_continue';
  duree_annees?: number;
  description?: string;
  documents_requis?: DocumentRequis[];
  prerequis?: Prerequis;
  frais_inscription?: number;
  date_limite_candidature?: string;
  capacite?: number;
  est_actif?: boolean;
  langue?: string;
  date_debut?: string;
}

// --- Instituts ---

export interface CreateInstitutData {
  email: string;
  password?: string;
  nom?: string;
  sigle?: string;
  description?: string;
  site_web?: string;
  logo?: string;
  adresse?: Adresse;
  accreditations?: string[];
  contact?: Contact;
  est_verifie?: boolean;
  note?: number;
}

export interface InviterInstitutData {
  email: string;
  nom?: string;
}

export interface TerminerPremierLoginData {
  token: string;
  password: string;
  nom: string;
  telephone?: string;
  description?: string;
}

// --- Utilisateurs ---

export interface UpdateUtilisateurData {
  // Champs communs
  email?: string;
  mot_de_passe?: string;
  est_actif?: boolean;
  // Candidat
  prenom?: string;
  nom?: string;
  date_naissance?: string;
  genre?: 'homme' | 'femme';
  telephone?: string;
  adresse?: Adresse;
  situation_familiale?: 'celibataire' | 'marie' | 'divorce' | 'veuf';
  type_bac?: 'mathematiques' | 'sciences' | 'technique' | 'economie' | 'lettres' | 'sport';
  moyenne_bac?: number;
  annee_bac?: number;
  langues?: string[];
  parcours_academique?: ParcoursAcademique[];
  niveau_actuel?: 'terminale' | 'bac' | 'licence' | 'master';
  photo_profil?: string;
  nationalite?: string;
  cin?: string;
  numero_passeport?: string;
  // Institut
  sigle?: string;
  description?: string;
  site_web?: string;
  logo?: string;
  accreditations?: string[];
  contact?: Contact;
  note?: number;
}

// --- Entités métier ---

export interface Candidat {
  id: string;
  utilisateur_id: string;
  prenom?: string;
  nom?: string;
  date_naissance?: string;
  genre?: string;
  telephone?: string;
  adresse?: Adresse;
  nationalite?: string;
  niveau_actuel?: string;
  moyenne_bac?: number;
  annee_bac?: number;
  langues?: string[];
  parcours_academique?: ParcoursAcademique[];
  photo_profil?: string;
  cin?: string;
  numero_passeport?: string;
  type_piece_identite?: 'cin' | 'passeport';
  cree_le?: string;
  mis_a_jour_le?: string;
}

/** Scores DiplomaVerifier — champ virtuel retourné par le backend */
export interface ScoresDiplome {
  global: number;
  niveau: 'low' | 'medium' | 'high' | null;
  /** critical_fields_score — identité + données académiques */
  cf: number | null;
  /** structure_score — mise en page officielle */
  struct: number | null;
  /** visual_authenticity_score — signature + cachet */
  vis: number | null;
  /** tampering.fraud_score brut (0=aucune anomalie, 100=très suspect). Intégrité = 100 - fraud. */
  fraud: number | null;
}

export interface Candidature {
  id: string;
  candidat_id: string;
  programme_id: string;
  statut: 'brouillon' | 'soumise' | 'en_examen' | 'acceptee' | 'refusee' | 'liste_attente';
  documents_soumis?: DocumentSoumis[];
  lettre_motivation?: string;
  notes_institut?: string;
  /** Score global DiplomaVerifier (0-100). Champ virtuel backend — alias de scores_diplome.global. */
  score_diplome?: number | null;
  /** Tous les scores DiplomaVerifier. Champ virtuel backend. */
  scores_diplome?: ScoresDiplome | null;
  soumise_le?: string;
  cree_le?: string;
  mis_a_jour_le?: string;
  programme?: Programme;
  candidat?: Candidat;
}

export interface Notification {
  id: string;
  utilisateur_id: string;
  type: 'statut_candidature' | 'nouveau_programme' | 'document_manquant' | 'rappel_echeance' | 'systeme';
  titre?: string;
  contenu?: string;
  est_lue: boolean;
  ref_id?: string;
  ref_type?: string;
  cree_le?: string;
}

export interface Favori {
  id: string;
  candidat_id: string;
  programme_id: string;
  cree_le?: string;
  programme?: Programme;
}

export interface Utilisateur {
  id: string;
  email: string;
  role: 'candidat' | 'institut' | 'admin';
  est_actif?: boolean;
  cree_le?: string;
  mis_a_jour_le?: string;
  candidat?: Candidat;
  institut?: Institut;
}

// --- Demandes d'accès ---

export interface DemandeAcces {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  presentation: string;
  statut: 'en_attente' | 'approuvee' | 'rejetee';
  notes_admin?: string | null;
  traite_par?: string | null;
  traite_le?: string | null;
  cree_le: string;
}

export interface DemandeAccesFilters {
  statut?: string;
  page?: number;
  limit?: number;
}

// --- Pré-inscriptions ---

export interface PreInscription {
  id: string;
  candidature_id: string;
  candidat_id: string;
  institut_id: string;
  programme_id: string;
  adresse_complete?: string | null;
  ville?: string | null;
  pays?: string | null;
  code_postal?: string | null;
  telephone?: string | null;
  date_naissance?: string | null;
  nationalite?: string | null;
  type_piece_identite?: 'cin' | 'passeport' | null;
  numero_piece_identite?: string | null;
  photo_identite_url?: string | null;
  statut: 'en_attente' | 'completee';
  completee_le?: string | null;
  cree_le?: string;
  mis_a_jour_le?: string;
}

export interface PreInscriptionFormData {
  candidature_id: string;
  adresse_complete?: string;
  ville?: string;
  pays?: string;
  code_postal?: string;
  telephone?: string;
  date_naissance?: string;
  nationalite?: string;
  type_piece_identite?: 'cin' | 'passeport';
  numero_piece_identite?: string;
}

// --- Erreurs API ---

export interface ApiError {
  message: string;
  error?: string;
  manquants?: string[];
}
