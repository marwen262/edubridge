'use strict'

// ============================================================
// SEEDER 3 — Programmes (11 formations sur 3 instituts)
// ============================================================
// ENUMs métier réels :
//   niveau : cycle_preparatoire | licence | master | ingenieur
//   mode   : cours_du_jour | cours_du_soir | alternance | formation_continue
// Les modes utilisent les 4 valeurs ENUM pour couvrir l'API de filtrage.
// ============================================================

// FK instituts (cohérents avec seeder 2)
const ESPRIT_INST_ID  = '22222222-1111-4aaa-8aaa-aaaaaaaaaaaa'
const MEDTECH_INST_ID = '22222222-2222-4bbb-8bbb-bbbbbbbbbbbb'
const POLY_INST_ID    = '22222222-3333-4ccc-8ccc-cccccccccccc'

// Programmes ESPRIT (4)
const PROG_ESPRIT_INFO_ID    = '33333333-1111-4111-8111-000000000001'
const PROG_ESPRIT_CIVIL_ID   = '33333333-1111-4111-8111-000000000002'
const PROG_ESPRIT_TELECOM_ID = '33333333-1111-4111-8111-000000000003'
const PROG_ESPRIT_ELECMEC_ID = '33333333-1111-4111-8111-000000000004'

// Programmes MedTech (3)
const PROG_MEDTECH_CE_ID     = '33333333-2222-4222-8222-000000000001'
const PROG_MEDTECH_SE_ID     = '33333333-2222-4222-8222-000000000002'
const PROG_MEDTECH_RENEW_ID  = '33333333-2222-4222-8222-000000000003'

// Programmes Polytechnique Sousse (4)
const PROG_POLY_INFO_ID      = '33333333-3333-4333-8333-000000000001'
const PROG_POLY_CIVIL_ID     = '33333333-3333-4333-8333-000000000002'
const PROG_POLY_TELECOM_ID   = '33333333-3333-4333-8333-000000000003'
const PROG_POLY_ELEC_ID      = '33333333-3333-4333-8333-000000000004'

// Helpers DRY pour les JSONB répétés
const documentsRequisStandard = JSON.stringify([
  { nom: 'cv',                obligatoire: true  },
  { nom: 'diplome_bac',       obligatoire: true  },
  { nom: 'releves_notes',     obligatoire: true  },
  { nom: 'lettre_motivation', obligatoire: false },
])

const prerequisStandard = JSON.stringify({
  moyenne_min: 12.0,
  matieres: ['Mathématiques', 'Physique'],
  types_bac: ['mathematiques', 'sciences', 'technique'],
})

const prerequisInfo = JSON.stringify({
  moyenne_min: 13.0,
  matieres: ['Mathématiques', 'Informatique', 'Physique'],
  types_bac: ['mathematiques', 'sciences', 'technique'],
})

const dateLimite = '2026-08-31'

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const maintenant = new Date()

    await queryInterface.bulkInsert('programmes', [

      // ── ESPRIT (4) ────────────────────────────────────────
      {
        id: PROG_ESPRIT_INFO_ID,
        institut_id: ESPRIT_INST_ID,
        titre: 'Génie Informatique',
        domaine: 'informatique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur en informatique : développement logiciel, " +
          "intelligence artificielle, cybersécurité.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisInfo,
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
        titre: 'Génie Civil',
        domaine: 'genie_civil',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur en génie civil : structures, hydraulique, " +
          "matériaux, BTP.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisStandard,
        frais_inscription: 7800.0,
        date_limite_candidature: dateLimite,
        capacite: 80,
        est_actif: true,
        langue: 'Français',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESPRIT_TELECOM_ID,
        institut_id: ESPRIT_INST_ID,
        titre: 'Génie Télécommunications',
        // Pas d'ENUM télécom dédié → mappé sur 'electrique' (proche métier)
        domaine: 'electrique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur en télécommunications : réseaux, " +
          "transmission, 5G, IoT.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisStandard,
        frais_inscription: 8200.0,
        date_limite_candidature: dateLimite,
        capacite: 70,
        est_actif: true,
        langue: 'Français/Anglais',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: PROG_ESPRIT_ELECMEC_ID,
        institut_id: ESPRIT_INST_ID,
        titre: 'Génie Électromécanique',
        // Mappé sur 'mecanique' (composante mécanique dominante)
        domaine: 'mecanique',
        niveau: 'ingenieur',
        mode: 'cours_du_soir',
        duree_annees: 3,
        description:
          "Cycle ingénieur électromécanique : automatisme, " +
          "conception mécanique, énergétique.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisStandard,
        frais_inscription: 8000.0,
        date_limite_candidature: dateLimite,
        capacite: 60,
        est_actif: true,
        langue: 'Français',
        date_debut: '2027-02-01',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // ── MedTech (3) ───────────────────────────────────────
      {
        id: PROG_MEDTECH_CE_ID,
        institut_id: MEDTECH_INST_ID,
        titre: 'Computer Engineering',
        domaine: 'informatique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "English-taught computer engineering program : hardware, " +
          "embedded systems, software architecture.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisInfo,
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
        titre: 'Software Engineering',
        domaine: 'informatique',
        niveau: 'ingenieur',
        mode: 'alternance',
        duree_annees: 3,
        description:
          "English-taught software engineering program : full-stack, " +
          "DevOps, agile methodologies.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisInfo,
        frais_inscription: 12500.0,
        date_limite_candidature: dateLimite,
        capacite: 50,
        est_actif: true,
        langue: 'Anglais',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: PROG_MEDTECH_RENEW_ID,
        institut_id: MEDTECH_INST_ID,
        titre: 'Renewable Energy Engineering',
        // Énergies renouvelables → 'electrique' (production/distribution)
        domaine: 'electrique',
        niveau: 'ingenieur',
        mode: 'formation_continue',
        duree_annees: 3,
        description:
          "Engineering program focused on solar, wind and " +
          "smart grid technologies.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisStandard,
        frais_inscription: 11500.0,
        date_limite_candidature: dateLimite,
        capacite: 40,
        est_actif: true,
        langue: 'Français/Anglais',
        date_debut: '2027-02-01',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // ── Polytechnique Sousse (4) ──────────────────────────
      {
        id: PROG_POLY_INFO_ID,
        institut_id: POLY_INST_ID,
        titre: 'Génie Informatique',
        domaine: 'informatique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Formation d'ingénieurs en informatique appliquée et " +
          "systèmes d'information.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisInfo,
        frais_inscription: 6500.0,
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
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur génie civil : ouvrages d'art, " +
          "géotechnique, gestion de chantier.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisStandard,
        frais_inscription: 6300.0,
        date_limite_candidature: dateLimite,
        capacite: 70,
        est_actif: true,
        langue: 'Français',
        date_debut: '2026-09-15',
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: PROG_POLY_TELECOM_ID,
        institut_id: POLY_INST_ID,
        titre: 'Génie Télécom et Réseaux',
        domaine: 'electrique',
        niveau: 'ingenieur',
        mode: 'cours_du_jour',
        duree_annees: 3,
        description:
          "Cycle ingénieur télécom et réseaux : architecture, " +
          "sécurité, virtualisation.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisStandard,
        frais_inscription: 6400.0,
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
          "Cycle ingénieur électrique : automatique, " +
          "électronique de puissance, robotique industrielle.",
        documents_requis: documentsRequisStandard,
        prerequis: prerequisStandard,
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
        PROG_ESPRIT_TELECOM_ID, PROG_ESPRIT_ELECMEC_ID,
        PROG_MEDTECH_CE_ID, PROG_MEDTECH_SE_ID, PROG_MEDTECH_RENEW_ID,
        PROG_POLY_INFO_ID, PROG_POLY_CIVIL_ID,
        PROG_POLY_TELECOM_ID, PROG_POLY_ELEC_ID,
      ],
    }, {})
  },

}
