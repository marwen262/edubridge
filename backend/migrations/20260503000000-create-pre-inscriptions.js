'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pre_inscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      candidature_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'candidatures', key: 'id' },
        onDelete: 'CASCADE',
      },
      candidat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'candidats', key: 'id' },
        onDelete: 'CASCADE',
      },
      institut_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'instituts', key: 'id' },
        onDelete: 'CASCADE',
      },
      programme_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'programmes', key: 'id' },
        onDelete: 'CASCADE',
      },
      adresse_complete:      { type: Sequelize.STRING(500), allowNull: true },
      ville:                 { type: Sequelize.STRING(100), allowNull: true },
      pays:                  { type: Sequelize.STRING(100), allowNull: true },
      code_postal:           { type: Sequelize.STRING(20),  allowNull: true },
      telephone:             { type: Sequelize.STRING(30),  allowNull: true },
      date_naissance:        { type: Sequelize.DATEONLY,    allowNull: true },
      nationalite:           { type: Sequelize.STRING(100), allowNull: true },
      type_piece_identite:   { type: Sequelize.STRING(50),  allowNull: true },
      numero_piece_identite: { type: Sequelize.STRING(50),  allowNull: true },
      photo_identite_url:    { type: Sequelize.STRING(500), allowNull: true },
      statut: {
        type: Sequelize.ENUM('en_attente', 'completee'),
        allowNull: false,
        defaultValue: 'en_attente',
      },
      completee_le:  { type: Sequelize.DATE, allowNull: true },
      cree_le:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      mis_a_jour_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('pre_inscriptions', ['candidat_id']);
    await queryInterface.addIndex('pre_inscriptions', ['statut']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pre_inscriptions');
  },
};
