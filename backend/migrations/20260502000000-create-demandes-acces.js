'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('demandes_acces', {
      id:            { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      nom:           { type: Sequelize.STRING(255), allowNull: false },
      email:         { type: Sequelize.STRING(255), allowNull: false, unique: true },
      telephone:     { type: Sequelize.STRING(30), allowNull: false },
      presentation:  { type: Sequelize.TEXT, allowNull: false },
      statut:        { type: Sequelize.ENUM('en_attente','approuvee','rejetee'), allowNull: false, defaultValue: 'en_attente' },
      notes_admin:   { type: Sequelize.TEXT, allowNull: true },
      traite_par:    { type: Sequelize.UUID, allowNull: true, references: { model: 'utilisateurs', key: 'id' }, onDelete: 'SET NULL' },
      traite_le:     { type: Sequelize.DATE, allowNull: true },
      cree_le:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      mis_a_jour_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('demandes_acces', ['statut']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('demandes_acces');
  },
};
