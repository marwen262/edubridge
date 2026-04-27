'use strict'

// Migration — ajout des champs manquants sur programmes et instituts
// programmes : langue, date_debut
// instituts  : image_couverture, taux_acceptation, nombre_etudiants

module.exports = {

  up: async (queryInterface, Sequelize) => {
    // ── programmes ─────────────────────────────────────────────
    await queryInterface.addColumn('programmes', 'langue', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    })

    await queryInterface.addColumn('programmes', 'date_debut', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null,
    })

    // ── instituts ──────────────────────────────────────────────
    await queryInterface.addColumn('instituts', 'image_couverture', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    })

    await queryInterface.addColumn('instituts', 'taux_acceptation', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    })

    await queryInterface.addColumn('instituts', 'nombre_etudiants', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    })
  },

  down: async (queryInterface, Sequelize) => {
    // Ordre inverse : instituts d'abord, puis programmes
    await queryInterface.removeColumn('instituts', 'nombre_etudiants')
    await queryInterface.removeColumn('instituts', 'taux_acceptation')
    await queryInterface.removeColumn('instituts', 'image_couverture')

    await queryInterface.removeColumn('programmes', 'date_debut')
    await queryInterface.removeColumn('programmes', 'langue')
  },

}
