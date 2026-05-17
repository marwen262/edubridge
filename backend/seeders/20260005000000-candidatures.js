'use strict'

// ============================================================
// SEEDER 5 — Candidatures (6 dossiers couvrant tous les statuts)
// ============================================================
// Format DiplomaVerifier dans notes_institut :
//   [DiplomaVerifier] score=XX/100, niveau=YY, cf=AA, struct=BB, vis=CC
//     cf     = critical_fields_score  (champs identité + académiques)
//     struct = structure_score         (mise en page officielle)
//     vis    = visual_authenticity_score (signature, cachet)
// ============================================================

const ALI_CAND_ID     = '44444444-1111-4aaa-8aaa-aaaaaaaaaaaa'
const SARRA_CAND_ID   = '44444444-2222-4bbb-8bbb-bbbbbbbbbbbb'
const YASSINE_CAND_ID = '44444444-3333-4ccc-8ccc-cccccccccccc'

const PROG_ESPRIT_INFO_ID    = '33333333-1111-4111-8111-000000000001'
const PROG_MEDTECH_CE_ID     = '33333333-2222-4222-8222-000000000001'
const PROG_MEDTECH_SE_ID     = '33333333-2222-4222-8222-000000000002'
const PROG_POLY_INFO_ID      = '33333333-3333-4333-8333-000000000001'
const PROG_POLY_CIVIL_ID     = '33333333-3333-4333-8333-000000000002'

const CAND_ALI_ESPRIT_INFO_ID    = '55555555-1111-4111-8111-000000000001'
const CAND_ALI_MEDTECH_CE_ID     = '55555555-1111-4111-8111-000000000002'
const CAND_SARRA_ESPRIT_INFO_ID  = '55555555-2222-4222-8222-000000000001'
const CAND_SARRA_MEDTECH_SE_ID   = '55555555-2222-4222-8222-000000000002'
const CAND_YASSINE_POLY_CIVIL_ID = '55555555-3333-4333-8333-000000000001'
const CAND_YASSINE_POLY_INFO_ID  = '55555555-3333-4333-8333-000000000002'

// Scores DiplomaVerifier pré-calculés pour chaque candidat / diplôme
// Format : [DiplomaVerifier] score=XX/100, niveau=YY, cf=AA, struct=BB, vis=CC
const SCORE_ALI     = '[DiplomaVerifier] score=72/100, niveau=medium, cf=70, struct=78, vis=65, fraud=15'
const SCORE_SARRA   = '[DiplomaVerifier] score=76/100, niveau=medium, cf=75, struct=80, vis=70, fraud=20'
const SCORE_YASSINE = '[DiplomaVerifier] score=58/100, niveau=low, cf=55, struct=62, vis=50, fraud=35'

// Documents de chaque candidat — diplôme réel + relevé de notes demo
const docsAli = JSON.stringify([
  {
    nom: 'diplome_bac',
    url: '/uploads/seed-diplome-ali.jpg',
    media_id: null,
    telecharge_le: '2026-04-05T10:00:00Z',
  },
  {
    nom: 'releves_notes',
    url: '/uploads/seed-releves-ali.png',
    media_id: null,
    telecharge_le: '2026-04-05T10:05:00Z',
  },
])

const docsSarra = JSON.stringify([
  {
    nom: 'diplome_bac',
    url: '/uploads/seed-diplome-sarra.jpg',
    media_id: null,
    telecharge_le: '2026-04-05T11:00:00Z',
  },
  {
    nom: 'releves_notes',
    url: '/uploads/seed-releves-sarra.jpg',
    media_id: null,
    telecharge_le: '2026-04-05T11:05:00Z',
  },
])

const docsYassine = JSON.stringify([
  {
    nom: 'diplome_bac',
    url: '/uploads/seed-diplome-yassine.png',
    media_id: null,
    telecharge_le: '2026-04-05T12:00:00Z',
  },
  {
    nom: 'releves_notes',
    url: '/uploads/seed-releves-yassine.png',
    media_id: null,
    telecharge_le: '2026-04-05T12:05:00Z',
  },
])

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const maintenant = new Date()

    await queryInterface.bulkInsert('candidatures', [

      // C1 — Ali → ESPRIT Info | brouillon (pas encore soumis, pas de score)
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

      // C2 — Ali → MedTech Computer Eng | soumise (score diplôme injecté)
      {
        id: CAND_ALI_MEDTECH_CE_ID,
        candidat_id: ALI_CAND_ID,
        programme_id: PROG_MEDTECH_CE_ID,
        statut: 'soumise',
        documents_soumis: docsAli,
        lettre_motivation:
          "Je souhaite intégrer le programme Computer Engineering pour " +
          "approfondir mes compétences en systèmes embarqués.",
        notes_institut: SCORE_ALI,
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
        documents_soumis: docsSarra,
        lettre_motivation:
          "Passionnée par l'IA et la cybersécurité, je vise le cycle " +
          "ingénieur informatique d'ESPRIT.",
        notes_institut:
          "Dossier en cours d'analyse par la commission pédagogique.\n" +
          SCORE_SARRA,
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
        documents_soumis: docsSarra,
        lettre_motivation:
          "Le programme Software Engineering en alternance correspond " +
          "exactement à mon projet professionnel.",
        notes_institut:
          "Excellent dossier (16.85/20). Admise. Confirmation requise " +
          "avant le 30/05/2026.\n" +
          '[DiplomaVerifier] score=82/100, niveau=high, cf=80, struct=85, vis=75, fraud=12',
        soumise_le: new Date('2026-04-05T11:15:00Z'),
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },

      // C5 — Yassine → Poly Civil | refusee (score faible)
      {
        id: CAND_YASSINE_POLY_CIVIL_ID,
        candidat_id: YASSINE_CAND_ID,
        programme_id: PROG_POLY_CIVIL_ID,
        statut: 'refusee',
        documents_soumis: docsYassine,
        lettre_motivation:
          "Je souhaite me spécialiser dans le génie civil et la " +
          "construction durable.",
        notes_institut:
          "Moyenne bac (12.10) inférieure au seuil requis pour ce cycle.\n" +
          SCORE_YASSINE,
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
        documents_soumis: docsYassine,
        lettre_motivation:
          "Reconversion vers l'informatique : je suis motivé par le " +
          "développement web et mobile.",
        notes_institut:
          "Sur liste d'attente — position 5. Une réponse définitive " +
          "sera communiquée d'ici fin juin.\n" +
          '[DiplomaVerifier] score=63/100, niveau=medium, cf=60, struct=68, vis=55, fraud=28',
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
