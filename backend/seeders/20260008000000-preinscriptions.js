'use strict';

// ============================================================
// SEEDER 8 — Pré-inscriptions
// ============================================================
// Crée 1 pré-inscription complétée pour la candidature acceptée
// de Sarra → MedTech Software Engineering (seeder 5, C4).
// ============================================================

// FK issues du seeder 5 (candidatures)
const CAND_SARRA_MEDTECH_SE_ID = '55555555-2222-4222-8222-000000000001';

// FK issues des seeders 3/4 (programmes, candidats, instituts)
const SARRA_CAND_ID    = '44444444-2222-4bbb-8bbb-bbbbbbbbbbbb';
const MEDTECH_INST_ID  = '22222222-2222-4bbb-8bbb-bbbbbbbbbbbb';
const PROG_MEDTECH_SE_ID = '33333333-2222-4222-8222-000000000002';

const PREINSCRIPTION_ID = '66666666-2222-4222-8222-000000000001';

module.exports = {
  up: async (queryInterface) => {
    const maintenant = new Date();

    await queryInterface.bulkInsert('pre_inscriptions', [
      {
        id:                    PREINSCRIPTION_ID,
        candidature_id:        CAND_SARRA_MEDTECH_SE_ID,
        candidat_id:           SARRA_CAND_ID,
        institut_id:           MEDTECH_INST_ID,
        programme_id:          PROG_MEDTECH_SE_ID,
        adresse_complete:      '8 Avenue de la République, Sfax',
        ville:                 'Sfax',
        pays:                  'Tunisie',
        code_postal:           '3000',
        telephone:             '+216 25 987 654',
        date_naissance:        '2004-07-25',
        nationalite:           'tunisienne',
        type_piece_identite:   'cin',
        numero_piece_identite: '22334455',
        photo_identite_url:    null,
        statut:                'completee',
        completee_le:          new Date('2026-05-10T10:00:00Z'),
        cree_le:               maintenant,
        mis_a_jour_le:         maintenant,
      },
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('pre_inscriptions', { id: [PREINSCRIPTION_ID] }, {});
  },
};
