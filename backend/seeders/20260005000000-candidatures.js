'use strict'

// ============================================================
// SEEDER 5 — Candidatures (6 dossiers couvrant tous les statuts)
// ============================================================
// Couverture des 6 valeurs de l'ENUM `candidatures.statut` :
//   brouillon, soumise, en_examen, acceptee, refusee, liste_attente
//
// Règles métier :
//   - statut='brouillon'    → soumise_le=null, documents_soumis=[],
//                             notes_institut=null
//   - statut='soumise'      → soumise_le=Date,    notes_institut=null
//   - autres statuts        → soumise_le=Date,    notes_institut=string
//   - aucun doublon (candidat_id, programme_id)
// ============================================================

// FK candidats (cohérents avec seeder 4)
const ALI_CAND_ID     = '44444444-1111-4aaa-8aaa-aaaaaaaaaaaa'
const SARRA_CAND_ID   = '44444444-2222-4bbb-8bbb-bbbbbbbbbbbb'
const YASSINE_CAND_ID = '44444444-3333-4ccc-8ccc-cccccccccccc'

// FK programmes (cohérents avec seeder 3)
const PROG_ESPRIT_INFO_ID    = '33333333-1111-4111-8111-000000000001'
const PROG_MEDTECH_CE_ID     = '33333333-2222-4222-8222-000000000001'
const PROG_MEDTECH_SE_ID     = '33333333-2222-4222-8222-000000000002'
const PROG_POLY_INFO_ID      = '33333333-3333-4333-8333-000000000001'
const PROG_POLY_CIVIL_ID     = '33333333-3333-4333-8333-000000000002'

// IDs candidatures (référencés par notifications.ref_id dans seeder 7)
const CAND_ALI_ESPRIT_INFO_ID    = '55555555-1111-4111-8111-000000000001'
const CAND_ALI_MEDTECH_CE_ID     = '55555555-1111-4111-8111-000000000002'
const CAND_SARRA_ESPRIT_INFO_ID  = '55555555-2222-4222-8222-000000000001'
const CAND_SARRA_MEDTECH_SE_ID   = '55555555-2222-4222-8222-000000000002'
const CAND_YASSINE_POLY_CIVIL_ID = '55555555-3333-4333-8333-000000000001'
const CAND_YASSINE_POLY_INFO_ID  = '55555555-3333-4333-8333-000000000002'

// Helper : 3 documents standards déjà uploadés
const documentsSoumisStandard = JSON.stringify([
  {
    nom: 'cv',
    url: '/uploads/seed-cv.pdf',
    media_id: null,
    telecharge_le: '2026-04-05T10:00:00Z',
  },
  {
    nom: 'diplome_bac',
    url: '/uploads/seed-diplome.pdf',
    media_id: null,
    telecharge_le: '2026-04-05T10:00:00Z',
  },
  {
    nom: 'releves_notes',
    url: '/uploads/seed-releves.pdf',
    media_id: null,
    telecharge_le: '2026-04-05T10:00:00Z',
  },
])

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const maintenant = new Date()

    await queryInterface.bulkInsert('candidatures', [

      // C1 — Ali → ESPRIT Info | brouillon
      {
        id: CAND_ALI_ESPRIT_INFO_ID,
        candidat_id: ALI_CAND_ID,
        programme_id: PROG_ESPRIT_INFO_ID,
        statut: 'brouillon',
        documents_soumis: JSON.stringify([]),
        lettre_motivation: null,
        notes_institut: null,
        soumise_le: null,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // C2 — Ali → MedTech Computer Eng | soumise
      {
        id: CAND_ALI_MEDTECH_CE_ID,
        candidat_id: ALI_CAND_ID,
        programme_id: PROG_MEDTECH_CE_ID,
        statut: 'soumise',
        documents_soumis: documentsSoumisStandard,
        lettre_motivation:
          "Je souhaite intégrer le programme Computer Engineering pour " +
          "approfondir mes compétences en systèmes embarqués.",
        notes_institut: null,
        soumise_le: new Date('2026-04-15T09:30:00Z'),
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // C3 — Sarra → ESPRIT Info | en_examen
      {
        id: CAND_SARRA_ESPRIT_INFO_ID,
        candidat_id: SARRA_CAND_ID,
        programme_id: PROG_ESPRIT_INFO_ID,
        statut: 'en_examen',
        documents_soumis: documentsSoumisStandard,
        lettre_motivation:
          "Passionnée par l'IA et la cybersécurité, je vise le cycle " +
          "ingénieur informatique d'ESPRIT.",
        notes_institut: "Dossier en cours d'analyse par la commission pédagogique.",
        soumise_le: new Date('2026-04-10T14:00:00Z'),
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // C4 — Sarra → MedTech Software Eng | acceptee
      {
        id: CAND_SARRA_MEDTECH_SE_ID,
        candidat_id: SARRA_CAND_ID,
        programme_id: PROG_MEDTECH_SE_ID,
        statut: 'acceptee',
        documents_soumis: documentsSoumisStandard,
        lettre_motivation:
          "Le programme Software Engineering en alternance correspond " +
          "exactement à mon projet professionnel.",
        notes_institut:
          "Excellent dossier (16.85/20). Admise. Confirmation requise " +
          "avant le 30/05/2026.",
        soumise_le: new Date('2026-04-05T11:15:00Z'),
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // C5 — Yassine → Poly Civil | refusee
      {
        id: CAND_YASSINE_POLY_CIVIL_ID,
        candidat_id: YASSINE_CAND_ID,
        programme_id: PROG_POLY_CIVIL_ID,
        statut: 'refusee',
        documents_soumis: documentsSoumisStandard,
        lettre_motivation:
          "Je souhaite me spécialiser dans le génie civil et la " +
          "construction durable.",
        notes_institut:
          "Moyenne bac (12.10) inférieure au seuil requis pour ce cycle.",
        soumise_le: new Date('2026-04-08T16:45:00Z'),
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // C6 — Yassine → Poly Info | liste_attente
      {
        id: CAND_YASSINE_POLY_INFO_ID,
        candidat_id: YASSINE_CAND_ID,
        programme_id: PROG_POLY_INFO_ID,
        statut: 'liste_attente',
        documents_soumis: documentsSoumisStandard,
        lettre_motivation:
          "Reconversion vers l'informatique : je suis motivé par le " +
          "développement web et mobile.",
        notes_institut:
          "Sur liste d'attente — position 5. Une réponse définitive " +
          "sera communiquée d'ici fin juin.",
        soumise_le: new Date('2026-04-12T08:20:00Z'),
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('candidatures', {
      id: [
        CAND_ALI_ESPRIT_INFO_ID,
        CAND_ALI_MEDTECH_CE_ID,
        CAND_SARRA_ESPRIT_INFO_ID,
        CAND_SARRA_MEDTECH_SE_ID,
        CAND_YASSINE_POLY_CIVIL_ID,
        CAND_YASSINE_POLY_INFO_ID,
      ],
    }, {})
  },

}
