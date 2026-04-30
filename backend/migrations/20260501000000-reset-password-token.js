'use strict';

// Migration — Réinitialisation de mot de passe
// Ajoute : utilisateurs.reset_password_token, reset_password_expires_at

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('utilisateurs', 'reset_password_token', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('utilisateurs', 'reset_password_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('utilisateurs', 'reset_password_expires_at');
    await queryInterface.removeColumn('utilisateurs', 'reset_password_token');
  },
};
