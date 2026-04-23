'use strict'

// ============================================================
// SEEDER 7 — Notifications (6 messages)
// ============================================================
// La table `notifications` n'a PAS de mis_a_jour_le (updatedAt: false).
// ENUM type : statut_candidature | nouveau_programme |
//             document_manquant | rappel_echeance | systeme
// ref_id/ref_type forment une référence polymorphe (ex: Candidature).
// N6 cible l'utilisateur ESPRIT (institut) — FK pointe vers utilisateurs.id.
// ============================================================

// FK utilisateurs (cohérents avec seeders 2 et 4)
const ESPRIT_USER_ID  = '22222222-1111-4111-8111-111111111111'
const ALI_USER_ID     = '44444444-1111-4111-8111-111111111111'
const SARRA_USER_ID   = '44444444-2222-4222-8222-222222222222'
const YASSINE_USER_ID = '44444444-3333-4333-8333-333333333333'

// FK candidatures (cohérents avec seeder 5) — pour ref_id polymorphe
const CAND_ALI_MEDTECH_CE_ID     = '55555555-1111-4111-8111-000000000002'
const CAND_SARRA_ESPRIT_INFO_ID  = '55555555-2222-4222-8222-000000000001'
const CAND_SARRA_MEDTECH_SE_ID   = '55555555-2222-4222-8222-000000000002'
const CAND_YASSINE_POLY_CIVIL_ID = '55555555-3333-4333-8333-000000000001'

// IDs notifications
const NOTIF_1_ID = '77777777-0000-4000-8000-000000000001'
const NOTIF_2_ID = '77777777-0000-4000-8000-000000000002'
const NOTIF_3_ID = '77777777-0000-4000-8000-000000000003'
const NOTIF_4_ID = '77777777-0000-4000-8000-000000000004'
const NOTIF_5_ID = '77777777-0000-4000-8000-000000000005'
const NOTIF_6_ID = '77777777-0000-4000-8000-000000000006'

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const maintenant = new Date()

    await queryInterface.bulkInsert('notifications', [
      // N1 — Ali : confirmation soumission candidature MedTech
      {
        id: NOTIF_1_ID,
        utilisateur_id: ALI_USER_ID,
        type: 'statut_candidature',
        titre: 'Candidature soumise avec succès',
        contenu:
          "Votre candidature au programme Computer Engineering (MedTech) " +
          "a bien été enregistrée.",
        est_lue: false,
        ref_id: CAND_ALI_MEDTECH_CE_ID,
        ref_type: 'Candidature',
        cree_le: maintenant,
      },

      // N2 — Ali : notification d'examen
      {
        id: NOTIF_2_ID,
        utilisateur_id: ALI_USER_ID,
        type: 'statut_candidature',
        titre: "Dossier en cours d'examen",
        contenu:
          "Votre dossier MedTech est en cours d'examen par la commission " +
          "pédagogique.",
        est_lue: false,
        ref_id: CAND_ALI_MEDTECH_CE_ID,
        ref_type: 'Candidature',
        cree_le: maintenant,
      },

      // N3 — Sarra : acceptation MedTech Software
      {
        id: NOTIF_3_ID,
        utilisateur_id: SARRA_USER_ID,
        type: 'statut_candidature',
        titre: 'Félicitations, candidature acceptée !',
        contenu:
          "Votre candidature au programme Software Engineering (MedTech) " +
          "a été acceptée. Confirmation requise avant le 30/05/2026.",
        est_lue: false,
        ref_id: CAND_SARRA_MEDTECH_SE_ID,
        ref_type: 'Candidature',
        cree_le: maintenant,
      },

      // N4 — Sarra : notification système (déjà lue)
      {
        id: NOTIF_4_ID,
        utilisateur_id: SARRA_USER_ID,
        type: 'systeme',
        titre: 'Bienvenue sur EduBridge',
        contenu:
          "Bienvenue Sarra ! Complétez votre profil pour maximiser vos " +
          "chances d'admission.",
        est_lue: true,
        ref_id: null,
        ref_type: null,
        cree_le: maintenant,
      },

      // N5 — Yassine : refus Poly Civil
      {
        id: NOTIF_5_ID,
        utilisateur_id: YASSINE_USER_ID,
        type: 'statut_candidature',
        titre: 'Candidature refusée',
        contenu:
          "Votre candidature au programme Génie Civil (Polytechnique Sousse) " +
          "n'a pas été retenue.",
        est_lue: false,
        ref_id: CAND_YASSINE_POLY_CIVIL_ID,
        ref_type: 'Candidature',
        cree_le: maintenant,
      },

      // N6 — ESPRIT (utilisateur institut) : nouvelle candidature reçue
      {
        id: NOTIF_6_ID,
        utilisateur_id: ESPRIT_USER_ID,
        type: 'statut_candidature',
        titre: 'Nouvelle candidature reçue',
        contenu:
          "Sarra Ben Salah a soumis une candidature pour le programme " +
          "Génie Informatique.",
        est_lue: false,
        ref_id: CAND_SARRA_ESPRIT_INFO_ID,
        ref_type: 'Candidature',
        cree_le: maintenant,
      },
    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('notifications', {
      id: [NOTIF_1_ID, NOTIF_2_ID, NOTIF_3_ID, NOTIF_4_ID, NOTIF_5_ID, NOTIF_6_ID],
    }, {})
  },

}
