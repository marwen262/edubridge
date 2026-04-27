'use strict'

// ============================================================
// SEEDER 1 — Admin EduBridge
// ============================================================
// Crée 1 utilisateur admin pour piloter la plateforme.
// Login : admin@edubridge.tn / Password123!
// ============================================================

const ADMIN_USER_ID = '11111111-1111-4111-8111-111111111111'

module.exports = {

  up: async (queryInterface, Sequelize) => {
    const bcrypt = require('bcryptjs')
    const motDePasseHash = await bcrypt.hash('Password123!', 10)
    const maintenant = new Date()

    // ── utilisateurs ────────────────────────────────────────
    await queryInterface.bulkInsert('utilisateurs', [
      {
        id: ADMIN_USER_ID,
        email: 'admin@edubridge.tn',
        mot_de_passe: motDePasseHash,
        role: 'admin',
        jeton_rafraichissement: null,
        est_actif: true,
        cree_le: maintenant,
        mis_a_jour_le: maintenant,
      },
    ], {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('utilisateurs', {
      id: [ADMIN_USER_ID],
    }, {})
  },

}
