'use strict'

// ============================================================
// SEEDER 3 — Programmes (11 formations sur 3 instituts)
// ============================================================
// Système LMD tunisien respecté :
//
//   cycle_preparatoire (2 ans) — GÉNÉRAL, commun à toutes spécialisations.
//     Contenu : mathématiques, physique, algorithmique, sciences de l'ingénieur.
//     ❌ INTERDIT : cycle préparatoire spécialisé (Télécom, Info, Civil…)
//
//   ingenieur (3 ans) — accessible APRÈS cycle préparatoire validé
//     OU réussite au concours national d'entrée ingénieur.
//     La spécialisation (Informatique, Civil, Télécom…) commence ici.
//
//   master (2 ans) — accessible sur dossier après licence ou diplôme ingénieur.
//
//   licence (3 ans) — bac+3, entrée directe.
//
// ENUMs métier :
//   niveau : cycle_preparatoire | licence | master | ingenieur
//   mode   : cours_du_jour | cours_du_soir | alternance | formation_continue
//
// Couverture modes (obligatoire pour l'API de filtrage) :
//   cours_du_jour   — 8 programmes (standard)
//   cours_du_soir   — 1 programme  (ESPRIT Licence Civil, profil en activité)
//   alternance      — 1 programme  (MedTech Master SE)
//   formation_continue — 1 programme (MedTech Licence Renewable Energy)
// ============================================================

// FK instituts (cohérents avec seeder 2)
const ESPRIT_INST_ID  = '22222222-1111-4aaa-8aaa-aaaaaaaaaaaa'
const MEDTECH_INST_ID = '22222222-2222-4bbb-8bbb-bbbbbbbbbbbb'
const POLY_INST_ID    = '22222222-3333-4ccc-8ccc-cccccccccccc'

// ── UUIDs STABLES (référencés par seeders 5 et 6) ────────────
// Programmes ESPRIT (4)
const PROG_ESPRIT_INFO_ID    = '33333333-1111-4111-8111-000000000001'
const PROG_ESPRIT_CIVIL_ID   = '33333333-1111-4111-8111-000000000002'
const PROG_ESPRIT_TELECOM_ID = '33333333-1111-4111-8111-000000000003'
const PROG_ESPRIT_PREP_ID    = '33333333-1111-4111-8111-000000000004'

// Programmes MedTech (3)
const PROG_MEDTECH_CE_ID     = '33333333-2222-4222-8222-000000000001'
const PROG_MEDTECH_SE_ID     = '33333333-2222-4222-8222-000000000002'
const PROG_MEDTECH_RENEW_ID  = '33333333-2222-4222-8222-000000000003'

// Programmes Polytechnique Sousse (4)
const PROG_POLY_PREP_ID      = '33333333-3333-4333-8333-000000000001'
const PROG_POLY_CIVIL_ID     = '33333333-3333-4333-8333-000000000002'
const PROG_POLY_TELECOM_ID   = '33333333-3333-4333-8333-000000000003'
const PROG_POLY_ELEC_ID      = '33333333-3333-4333-8333-000000000004'

const dateLimite = '2026-08-31'

// ── Documents requis par niveau métier ───────────────────────
// Source de vérité : programme.documents_requis (JSONB [{nom, obligatoire, label}]).
// verifierCompletude() lit ces listes dynamiquement — aucune règle globale hardcodée.
// Champ label : affiché par le frontend ; ignoré par la logique de validation.
// Seeder 5 injecte cv+diplome_bac+releves_notes via bulkInsert (hors workflow) ;
// les candidatures déjà soumises ne sont jamais re-validées.

// Cycle Préparatoire Intégré (post-bac, 2 ans)
const documentsRequisPreparatoire = JSON.stringify([
  { nom: 'diplome_bac',       obligatoire: true,  label: 'Diplôme / Attestation Baccalauréat' },
  { nom: 'releves_notes',     obligatoire: true,  label: 'Relevés de notes lycée (2e et 3e années)' },
  { nom: 'piece_identite',    obligatoire: false, label: 'CIN ou Passeport' },
  { nom: 'photo_identite',    obligatoire: false, label: "Photo d'identité récente" },
  { nom: 'lettre_motivation', obligatoire: false, label: 'Lettre de motivation' },
])

// Licence (bac+3, entrée directe)
const documentsRequisLicence = JSON.stringify([
  { nom: 'diplome_bac',       obligatoire: true,  label: 'Diplôme Baccalauréat' },
  { nom: 'releves_notes',     obligatoire: true,  label: 'Relevés de notes' },
  { nom: 'piece_identite',    obligatoire: true,  label: 'CIN ou Passeport' },
  { nom: 'lettre_motivation', obligatoire: false, label: 'Lettre de motivation' },
])

// Cycle Ingénieur (bac+5) — après Cycle Préparatoire validé ou concours national
const documentsRequisIngenieur = JSON.stringify([
  { nom: 'releves_notes',     obligatoire: true,  label: 'Relevés de notes Cycle Préparatoire' },
  { nom: 'attestation_prepa', obligatoire: true,  label: 'Attestation validation Cycle Préparatoire (ou résultat concours)' },
  { nom: 'piece_identite',    obligatoire: true,  label: 'CIN ou Passeport' },
  { nom: 'diplome_bac',       obligatoire: false, label: 'Diplôme Baccalauréat' },
  { nom: 'lettre_motivation', obligatoire: false, label: 'Lettre de motivation' },
  { nom: 'attestation_stage', obligatoire: false, label: 'Attestation de stage' },
])

// Master (bac+5) — sur dossier après licence ou diplôme ingénieur
const documentsRequisMaster = JSON.stringify([
  { nom: 'diplome_licence',       obligatoire: true,  label: 'Diplôme Licence (ou Diplôme Ingénieur équivalent)' },
  { nom: 'releves_notes',         obligatoire: true,  label: 'Relevés de notes Licence' },
  { nom: 'lettre_motivation',     obligatoire: true,  label: 'Lettre de motivation' },
  { nom: 'piece_identite',        obligatoire: true,  label: 'CIN ou Passeport' },
  { nom: 'lettre_recommandation', obligatoire: false, label: 'Lettre de recommandation' },
])

// Programmes internationaux MedTech (anglophone + partenariats)
// piece_identite obligatoire : vérification d'identité plus stricte pour cursus international
const documentsRequisInternational = JSON.stringify([
  { nom: 'diplome_bac',           obligatoire: true,  label: 'Diplôme Baccalauréat' },
  { nom: 'releves_notes',         obligatoire: true,  label: 'Relevés de notes' },
  { nom: 'piece_identite',        obligatoire: true,  label: 'CIN ou Passeport' },
  { nom: 'lettre_motivation',     obligatoire: false, label: 'Lettre de motivation (en anglais)' },
  { nom: 'lettre_recommandation', obligatoire: false, label: 'Lettre de recommandation' },
])

// ── Prérequis par niveau ─────────────────────────────────────

const prerequisBac = JSON.stringify({
  conditions: [
    'Baccalauréat (Mathématiques, Sciences Techniques ou Sciences Expérimentales)',
  ],
  moyenne_bac_min: 12.0,
  types_bac: ['mathematiques', 'sciences', 'technique'],
})

const prerequisBacInfo = JSON.stringify({
  conditions: [
    'Baccalauréat (Mathématiques ou Sciences Techniques)',
  ],
  moyenne_bac_min: 13.0,
  types_bac: ['mathematiques', 'sciences', 'technique'],
})

// Cycle ingénieur : prépa intégrée validée OU concours national
const prerequisIngenieur = JSON.stringify({
  conditions: [
    "Cycle Préparatoire Intégré validé (2 ans)",
    "OU réussite au concours national d'entrée ingénieur",
  ],
  moyenne_prepa_min: 12.0,
  types_bac: ['mathematiques', 'sciences', 'technique'],
})

const prerequisIngenieurInfo = JSON.stringify({
  conditions: [
    "Cycle Préparatoire Intégré validé (2 ans)",
    "OU réussite au concours national d'entrée ingénieur",
  ],
  moyenne_prepa_min: 13.0,
  types_bac: ['mathematiques', 'sciences', 'technique'],
})

// Master : licence compatible ou diplôme ingénieur
const prerequisMasterTelecom = JSON.stringify({
  conditions: [
    "Licence appliquée ou fondamentale en électronique, réseaux ou télécommunications",
    "OU Diplôme d'ingénieur en électrique, télécom ou informatique",
  ],
  moyenne_min: 12.0,
  specialites_compatibles: ['electrique', 'informatique'],
})

const prerequisMasterSoftware = JSON.stringify({
  conditions: [
    "Licence appliquée ou fondamentale en informatique ou génie logiciel",
    "OU Diplôme d'ingénieur en informatique ou systèmes embarqués",
  ],
  moyenne_min: 13.0,
  specialites_compatibles: ['informatique'],
})

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const maintenant = new Date()

    await queryInterface.bulkInsert('programmes', [

      // ── ESPRIT (4) ────────────────────────────────────────
      // Structure : 1 cycle prépa intégré + 1 cycle ingénieur + 1 master + 1 licence soir

      {
        id: PROG_ESPRIT_INFO_ID,
        institut_id: ESPRIT_INST_ID,
        titre: 'Génie Informatique',
        domaine: 'informatique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur en informatique (bac+5) : développement logiciel avancé, " +
          "intelligence artificielle, cybersécurité et cloud computing. " +
          "Accessible après validation du Cycle Préparatoire Intégré (2 ans) " +
          "ou réussite au concours national d'entrée ingénieur.",
        documents_requis: documentsRequisIngenieur,
        prerequis: prerequisIngenieurInfo,
        frais_inscription: 8500.0,
        date_limite_candidature: dateLimite,
        capacite: 120,
        est_actif: true,
        langue: 'Français',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      {
        id: PROG_ESPRIT_CIVIL_ID,
        institut_id: ESPRIT_INST_ID,
        titre: 'Licence Génie Civil',
        domaine: 'genie_civil',
        niveau: 'licence',
        // Cours en soirée : accessible aux bacheliers déjà en activité professionnelle
        mode: 'cours_du_soir',
        duree_annees: 3,
        description:
          "Licence appliquée en génie civil (bac+3) : structures portantes, " +
          "hydraulique, matériaux de construction et gestion de chantier. " +
          "Cours organisés en soirée pour permettre la poursuite d'une activité.",
        documents_requis: documentsRequisLicence,
        prerequis: prerequisBac,
        frais_inscription: 5200.0,
        date_limite_candidature: dateLimite,
        capacite: 60,
        est_actif: true,
        langue: 'Français',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      {
        id: PROG_ESPRIT_TELECOM_ID,
        institut_id: ESPRIT_INST_ID,
        titre: 'Master Télécommunications et Réseaux',
        // Pas d'ENUM télécom → mappé sur 'electrique' (champ disciplinaire parent)
        domaine: 'electrique',
        niveau: 'master',
        mode: 'cours_du_jour',
        duree_annees: 2,
        description:
          "Master recherche/professionnel en télécommunications (bac+5) : " +
          "réseaux mobiles 5G, protocoles IoT, transmission optique et sécurité " +
          "des réseaux. Accessible sur dossier après licence compatible " +
          "ou diplôme d'ingénieur.",
        documents_requis: documentsRequisMaster,
        prerequis: prerequisMasterTelecom,
        frais_inscription: 8200.0,
        date_limite_candidature: dateLimite,
        capacite: 50,
        est_actif: true,
        langue: 'Français/Anglais',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      {
        id: PROG_ESPRIT_PREP_ID,
        institut_id: ESPRIT_INST_ID,
        // Cycle Préparatoire Intégré : 2 ans GÉNÉRAUX communs avant spécialisation ingénieur.
        // ❌ Ne jamais nommer "Cycle Préparatoire Électromécanique / Informatique / Télécom".
        titre: 'Cycle Préparatoire Intégré',
        domaine: 'mecanique',
        niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour',
        duree_annees: 2,
        description:
          "Cycle préparatoire intégré (2 ans) commun à toutes les spécialisations " +
          "ingénieur ESPRIT : mathématiques avancées, physique, algorithmique " +
          "et sciences de l'ingénieur. " +
          "La spécialisation (Informatique, Civil, Électromécanique…) " +
          "est choisie en fin de cycle selon classement et vœux.",
        documents_requis: documentsRequisPreparatoire,
        prerequis: prerequisBac,
        frais_inscription: 5500.0,
        date_limite_candidature: dateLimite,
        capacite: 80,
        est_actif: true,
        langue: 'Français',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // ── MedTech (3) ───────────────────────────────────────
      // École 100% anglophone, partenariats internationaux, frais plus élevés

      {
        id: PROG_MEDTECH_CE_ID,
        institut_id: MEDTECH_INST_ID,
        titre: 'Computer Engineering',
        domaine: 'informatique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "English-taught engineer cycle in computer engineering (bac+5): " +
          "hardware architecture, embedded systems, software engineering " +
          "and full-stack development. Admitted after a validated 2-year " +
          "preparatory cycle or equivalent competitive exam.",
        documents_requis: documentsRequisInternational,
        prerequis: prerequisIngenieurInfo,
        frais_inscription: 12000.0,
        date_limite_candidature: dateLimite,
        capacite: 50,
        est_actif: true,
        langue: 'Anglais',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      {
        id: PROG_MEDTECH_SE_ID,
        institut_id: MEDTECH_INST_ID,
        titre: 'Master Software Engineering',
        domaine: 'informatique',
        niveau: 'master',
        mode: 'alternance',
        duree_annees: 2,
        description:
          "English-taught master in software engineering (bac+5) in work-study " +
          "format: full-stack web, DevOps, agile methodologies and software " +
          "architecture patterns. Candidates must hold a compatible bachelor " +
          "or engineering degree in computer science.",
        documents_requis: documentsRequisInternational,
        prerequis: prerequisMasterSoftware,
        frais_inscription: 12500.0,
        date_limite_candidature: dateLimite,
        capacite: 40,
        est_actif: true,
        langue: 'Anglais',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      {
        id: PROG_MEDTECH_RENEW_ID,
        institut_id: MEDTECH_INST_ID,
        titre: 'Licence Renewable Energy',
        // Énergies renouvelables → domaine 'electrique' (production/distribution)
        domaine: 'electrique',
        niveau: 'licence',
        mode: 'formation_continue',
        duree_annees: 3,
        description:
          "Bachelor program in renewable energy systems (bac+3): solar " +
          "photovoltaic, wind power, smart grids and energy efficiency. " +
          "Designed for working professionals in the energy sector seeking " +
          "career advancement — evening and weekend sessions.",
        documents_requis: documentsRequisLicence,
        prerequis: prerequisBac,
        frais_inscription: 9000.0,
        date_limite_candidature: dateLimite,
        capacite: 40,
        est_actif: true,
        langue: 'Français/Anglais',
        date_debut: '2027-02-01',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // ── Polytechnique Sousse (4) ──────────────────────────
      // Structure canonique : 1 cycle prépa intégré (général) → 3 spécialisations ingénieur

      {
        id: PROG_POLY_PREP_ID,
        institut_id: POLY_INST_ID,
        // Cycle Préparatoire Intégré général : entrée unique vers les 3 filières ingénieur.
        // ❌ Ne jamais nommer "Cycle Préparatoire Informatique / Télécom / Civil".
        titre: 'Cycle Préparatoire Intégré',
        domaine: 'informatique',
        niveau: 'cycle_preparatoire',
        mode: 'cours_du_jour',
        duree_annees: 2,
        description:
          "Cycle préparatoire intégré (2 ans) commun aux filières ingénieur de " +
          "l'École Polytechnique de Sousse : mathématiques, physique, algorithmique " +
          "et sciences de l'ingénieur. " +
          "Le choix de spécialité (Informatique, Génie Civil, Télécom, " +
          "Électrique) s'effectue en fin de première année selon classement et vœux.",
        documents_requis: documentsRequisPreparatoire,
        prerequis: prerequisBacInfo,
        frais_inscription: 4200.0,
        date_limite_candidature: dateLimite,
        capacite: 90,
        est_actif: true,
        langue: 'Français',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      {
        id: PROG_POLY_CIVIL_ID,
        institut_id: POLY_INST_ID,
        titre: 'Génie Civil',
        domaine: 'genie_civil',
        // Cycle ingénieur (bac+5) : accessible après Cycle Préparatoire Intégré
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur en génie civil (bac+5) : ouvrages d'art, géotechnique, " +
          "hydraulique, matériaux de construction et gestion de projets BTP. " +
          "Accessible après validation du Cycle Préparatoire Intégré (2 ans) " +
          "ou réussite au concours national d'entrée ingénieur.",
        documents_requis: documentsRequisIngenieur,
        prerequis: prerequisIngenieur,
        frais_inscription: 5500.0,
        date_limite_candidature: dateLimite,
        capacite: 60,
        est_actif: true,
        langue: 'Français',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      {
        id: PROG_POLY_TELECOM_ID,
        institut_id: POLY_INST_ID,
        // Filière ingénieur spécialisée (bac+5), distincte du Cycle Préparatoire Intégré.
        // ❌ ANCIEN NOM INCORRECT : "Cycle Préparatoire Télécom et Réseaux"
        titre: 'Génie des Télécommunications et Réseaux',
        // Pas d'ENUM télécom → mappé sur 'electrique' (domaine parent TIC/STIC)
        domaine: 'electrique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur en télécommunications et réseaux (bac+5) : " +
          "réseaux IP, systèmes de transmission, télécommunications mobiles 5G, " +
          "cybersécurité et protocoles IoT. " +
          "Accessible après validation du Cycle Préparatoire Intégré (2 ans) " +
          "ou réussite au concours national d'entrée ingénieur.",
        documents_requis: documentsRequisIngenieur,
        prerequis: prerequisIngenieur,
        frais_inscription: 5800.0,
        date_limite_candidature: dateLimite,
        capacite: 60,
        est_actif: true,
        langue: 'Français/Anglais',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      {
        id: PROG_POLY_ELEC_ID,
        institut_id: POLY_INST_ID,
        titre: 'Génie Électrique et Automatique',
        domaine: 'electrique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur en génie électrique et automatique (bac+5) : " +
          "électronique de puissance, automatique industrielle, robotique, " +
          "machines électriques et intégration des énergies renouvelables. " +
          "Accessible après validation du Cycle Préparatoire Intégré (2 ans) " +
          "ou réussite au concours national d'entrée ingénieur.",
        documents_requis: documentsRequisIngenieur,
        prerequis: prerequisIngenieur,
        frais_inscription: 6400.0,
        date_limite_candidature: dateLimite,
        capacite: 60,
        est_actif: true,
        langue: 'Français',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('programmes', {
      id: [
        PROG_ESPRIT_INFO_ID, PROG_ESPRIT_CIVIL_ID,
        PROG_ESPRIT_TELECOM_ID, PROG_ESPRIT_PREP_ID,
        PROG_MEDTECH_CE_ID, PROG_MEDTECH_SE_ID, PROG_MEDTECH_RENEW_ID,
        PROG_POLY_PREP_ID, PROG_POLY_CIVIL_ID,
        PROG_POLY_TELECOM_ID, PROG_POLY_ELEC_ID,
      ],
    }, {})
  },

}
