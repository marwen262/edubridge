'use strict'

// ============================================================
// SEEDER 2 — Instituts (3 écoles d'ingénieurs tunisiennes)
// ============================================================
// Crée pour chaque institut :
//   - 1 ligne dans `utilisateurs` (role='institut')
//   - 1 ligne dans `instituts` liée via utilisateur_id
// Login pour chacun : <email_contact> / Password123!
// ============================================================

// Comptes utilisateur (FK vers instituts.utilisateur_id)
const ESPRIT_USER_ID  = '22222222-1111-4111-8111-111111111111'
const MEDTECH_USER_ID = '22222222-2222-4222-8222-222222222222'
const POLY_USER_ID    = '22222222-3333-4333-8333-333333333333'

// Profils institut
const ESPRIT_INST_ID  = '22222222-1111-4aaa-8aaa-aaaaaaaaaaaa'
const MEDTECH_INST_ID = '22222222-2222-4bbb-8bbb-bbbbbbbbbbbb'
const POLY_INST_ID    = '22222222-3333-4ccc-8ccc-cccccccccccc'

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const bcrypt = require('bcryptjs')
    const motDePasseHash = await bcrypt.hash('Password123!', 10)
    const maintenant = new Date()

    // ── utilisateurs (3 comptes institut) ───────────────────
    await queryInterface.bulkInsert('utilisateurs', [
      {
        id: ESPRIT_USER_ID,
        email: 'contact@esprit.tn',
        mot_de_passe: motDePasseHash,
        role: 'institut',
        jeton_rafraichissement: null,
        est_actif: true,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: MEDTECH_USER_ID,
        email: 'contact@medtech.tn',
        mot_de_passe: motDePasseHash,
        role: 'institut',
        jeton_rafraichissement: null,
        est_actif: true,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: POLY_USER_ID,
        email: 'contact@polytechsousse.tn',
        mot_de_passe: motDePasseHash,
        role: 'institut',
        jeton_rafraichissement: null,
        est_actif: true,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
    ], {})

    // ── instituts (3 profils écoles) ────────────────────────
    await queryInterface.bulkInsert('instituts', [
      {
        id: ESPRIT_INST_ID,
        utilisateur_id: ESPRIT_USER_ID,
        nom: "École Supérieure Privée d'Ingénierie et de Technologies",
        sigle: 'ESPRIT',
        description:
          "ESPRIT est une école d'ingénieurs privée tunisienne fondée en 2003, " +
          "spécialisée dans les TIC, le génie civil et l'électromécanique.",
        site_web: 'https://esprit.tn',
        logo: '/uploads/seed-logo-esprit.png',
        adresse: JSON.stringify({
          rue: "2 Rue André Ampère",
          ville: 'Ariana',
          gouvernorat: 'Ariana',
          code_postal: '2083',
          pays: 'Tunisie',
        }),
        // ARRAY(STRING) — array JS natif (pas de JSON.stringify)
        accreditations: ['CTI', 'EUR-ACE'],
        contact: JSON.stringify({
          telephone: '+216 70 250 000',
          email: 'contact@esprit.tn',
          fax: '+216 70 685 685',
        }),
        est_verifie: true,
        note: 4.5,
        image_couverture: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&h=600&fit=crop',
        taux_acceptation: 0.45,
        nombre_etudiants: 8000,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: MEDTECH_INST_ID,
        utilisateur_id: MEDTECH_USER_ID,
        nom: 'Mediterranean Institute of Technology',
        sigle: 'MedTech',
        description:
          "MedTech est une école d'ingénieurs membre de l'Université Centrale, " +
          "offrant des cursus 100% anglophones en partenariat international.",
        site_web: 'https://medtech.tn',
        logo: '/uploads/seed-logo-medtech.png',
        adresse: JSON.stringify({
          rue: "Avenue du Roi Abdelaziz Al Saoud",
          ville: 'Tunis',
          gouvernorat: 'Tunis',
          code_postal: '1082',
          pays: 'Tunisie',
        }),
        accreditations: ['ABET', 'EUR-ACE'],
        contact: JSON.stringify({
          telephone: '+216 71 234 567',
          email: 'contact@medtech.tn',
          fax: '+216 71 234 568',
        }),
        est_verifie: true,
        note: 4.3,
        image_couverture: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop',
        taux_acceptation: 0.30,
        nombre_etudiants: 3500,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
      {
        id: POLY_INST_ID,
        utilisateur_id: POLY_USER_ID,
        nom: 'École Polytechnique de Sousse',
        sigle: 'EPSousse',
        description:
          "L'École Polytechnique de Sousse forme des ingénieurs " +
          "dans les domaines du génie civil, électrique, télécom et informatique.",
        site_web: 'https://polytechsousse.tn',
        logo: '/uploads/seed-logo-poly.png',
        adresse: JSON.stringify({
          rue: 'Route de Ceinture Sahloul',
          ville: 'Sousse',
          gouvernorat: 'Sousse',
          code_postal: '4054',
          pays: 'Tunisie',
        }),
        accreditations: ['CTI'],
        contact: JSON.stringify({
          telephone: '+216 73 100 200',
          email: 'contact@polytechsousse.tn',
          fax: '+216 73 100 201',
        }),
        est_verifie: true,
        note: 4.1,
        image_couverture: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=600&fit=crop',
        taux_acceptation: 0.35,
        nombre_etudiants: 5000,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    // Ordre inverse des FK (instituts → utilisateurs)
    await queryInterface.bulkDelete('instituts', {
      id: [ESPRIT_INST_ID, MEDTECH_INST_ID, POLY_INST_ID],
    }, {})

    await queryInterface.bulkDelete('utilisateurs', {
      id: [ESPRIT_USER_ID, MEDTECH_USER_ID, POLY_USER_ID],
    }, {})
  },

}
