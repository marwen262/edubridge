// Types basés sur les modèles Sequelize du backend (backend.md §5)

// --- Sous-types utilitaires ---

export interface Adresse {
  rue?: string;
  ville?: string;
  gouvernorat?: string;
  code_postal?: string;
  pays?: string;
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

/** Institut complet tel que retourné par /api/instituts */
export interface Institut {
  id: string;
  utilisateur_id: string;
  nom: string;
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
  cree_le?: string;
  mis_a_jour_le?: string;
  /** Programmes publiés par l'institut */
  programmes?: Programme[];
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

// --- Filtres ---

export interface ProgrammeFilters {
  domaine?: 'informatique' | 'genie_civil' | 'electrique' | 'mecanique' | 'chimie' | 'agronomie' | 'finance' | 'management';
  niveau?: 'cycle_preparatoire' | 'licence' | 'master' | 'ingenieur';
  mode?: 'cours_du_jour' | 'cours_du_soir' | 'alternance' | 'formation_continue';
  institut_id?: string;
  est_actif?: boolean;
  titre?: string;
}

export interface InstitutFilters {
  nom?: string;
  est_verifie?: boolean;
}

export interface CandidatureFilters {
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
}

// --- Instituts ---

export interface CreateInstitutData {
  email: string;
  password: string;
  nom: string;
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

export interface Candidature {
  id: string;
  candidat_id: string;
  programme_id: string;
  statut: 'brouillon' | 'soumise' | 'en_examen' | 'acceptee' | 'refusee' | 'liste_attente';
  documents_soumis?: DocumentSoumis[];
  lettre_motivation?: string;
  notes_institut?: string;
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

// --- Erreurs API ---

export interface ApiError {
  message: string;
  error?: string;
  manquants?: string[];
}
