'use strict'

// ============================================================
// SEEDER 6 — Favoris (5 entrées)
// ============================================================
// Respect de l'index unique (candidat_id, programme_id).
// La table `favoris` n'a PAS de mis_a_jour_le (updatedAt: false).
// ============================================================

// FK candidats (cohérents avec seeder 4)
const ALI_CAND_ID     = '44444444-1111-4aaa-8aaa-aaaaaaaaaaaa'
const SARRA_CAND_ID   = '44444444-2222-4bbb-8bbb-bbbbbbbbbbbb'
const YASSINE_CAND_ID = '44444444-3333-4ccc-8ccc-cccccccccccc'

// FK programmes (cohérents avec seeder 3)
const PROG_ESPRIT_TELECOM_ID = '33333333-1111-4111-8111-000000000003'
const PROG_MEDTECH_CE_ID     = '33333333-2222-4222-8222-000000000001'
const PROG_MEDTECH_SE_ID     = '33333333-2222-4222-8222-000000000002'
const PROG_MEDTECH_RENEW_ID  = '33333333-2222-4222-8222-000000000003'
const PROG_POLY_INFO_ID      = '33333333-3333-4333-8333-000000000001'

// IDs favoris
const FAV_ALI_POLY_INFO_ID      = '66666666-1111-4111-8111-000000000001'
const FAV_ALI_MEDTECH_SE_ID     = '66666666-1111-4111-8111-000000000002'
const FAV_SARRA_ESPRIT_TEL_ID   = '66666666-2222-4222-8222-000000000001'
const FAV_SARRA_MEDTECH_REN_ID  = '66666666-2222-4222-8222-000000000002'
const FAV_YASSINE_MEDTECH_CE_ID = '66666666-3333-4333-8333-000000000001'

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const maintenant = new Date()

    await queryInterface.bulkInsert('favoris', [
      {
        id: FAV_ALI_POLY_INFO_ID,
        candidat_id: ALI_CAND_ID,
        programme_id: PROG_POLY_INFO_ID,
        cree_le: maintenant,
      },
      {
        id: FAV_ALI_MEDTECH_SE_ID,
        candidat_id: ALI_CAND_ID,
        programme_id: PROG_MEDTECH_SE_ID,
        cree_le: maintenant,
      },
      {
        id: FAV_SARRA_ESPRIT_TEL_ID,
        candidat_id: SARRA_CAND_ID,
        programme_id: PROG_ESPRIT_TELECOM_ID,
        cree_le: maintenant,
      },
      {
        id: FAV_SARRA_MEDTECH_REN_ID,
        candidat_id: SARRA_CAND_ID,
        programme_id: PROG_MEDTECH_RENEW_ID,
        cree_le: maintenant,
      },
      {
        id: FAV_YASSINE_MEDTECH_CE_ID,
        candidat_id: YASSINE_CAND_ID,
        programme_id: PROG_MEDTECH_CE_ID,
        cree_le: maintenant,
      },
    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('favoris', {
      id: [
        FAV_ALI_POLY_INFO_ID,
        FAV_ALI_MEDTECH_SE_ID,
        FAV_SARRA_ESPRIT_TEL_ID,
        FAV_SARRA_MEDTECH_REN_ID,
        FAV_YASSINE_MEDTECH_CE_ID,
      ],
    }, {})
  },

}
