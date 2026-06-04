'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_candidats_type_bac ADD VALUE IF NOT EXISTS 'informatique';`
    );
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL ne supporte pas DROP VALUE sur un enum — migration irréversible
  },
};
