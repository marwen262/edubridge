'use strict';

// Migration — Workflow institution SaaS (invitation, first login, validation admin, suspension)
// Modifie : utilisateurs (token first login, nullable password)
// Modifie : instituts (validation_status, suspension)

module.exports = {
  async up(queryInterface, Sequelize) {

    // ── utilisateurs : rendre mot_de_passe nullable ───────────────────────
    // Les comptes invités n'ont pas encore de mot de passe avant le first login
    await queryInterface.changeColumn('utilisateurs', 'mot_de_passe', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // ── utilisateurs : champs first login ────────────────────────────────
    await queryInterface.addColumn('utilisateurs', 'first_login_token', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('utilisateurs', 'first_login_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // true pour tous les comptes existants (ils ont déjà un mot de passe)
    await queryInterface.addColumn('utilisateurs', 'first_login_completed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    // ── instituts : nom nullable ──────────────────────────────────────────
    // Le nom sera rempli lors du premier login (onboarding)
    await queryInterface.changeColumn('instituts', 'nom', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // ── instituts : ENUM validation_status ───────────────────────────────
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_instituts_validation_status
          AS ENUM ('invited', 'pending_admin_review', 'approved', 'rejected', 'suspended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Les instituts existants sont considérés comme approuvés (rétrocompatibilité)
    await queryInterface.addColumn('instituts', 'validation_status', {
      type: Sequelize.ENUM(
        'invited', 'pending_admin_review', 'approved', 'rejected', 'suspended'
      ),
      allowNull: false,
      defaultValue: 'approved',
    });

    await queryInterface.addColumn('instituts', 'suspension_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('instituts', 'suspended_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('instituts', 'suspended_by', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // ── instituts : colonnes manquantes du modèle initial ────────────────
    // Ces champs sont définis dans Institut.js mais absents de la migration initiale
    const desc = await queryInterface.describeTable('instituts');

    if (!desc.image_couverture) {
      await queryInterface.addColumn('instituts', 'image_couverture', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!desc.taux_acceptation) {
      await queryInterface.addColumn('instituts', 'taux_acceptation', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    }
    if (!desc.nombre_etudiants) {
      await queryInterface.addColumn('instituts', 'nombre_etudiants', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    // Synchroniser est_verifie avec validation_status pour les données existantes
    await queryInterface.sequelize.query(`
      UPDATE instituts SET est_verifie = (validation_status = 'approved');
    `);
  },

  async down(queryInterface, Sequelize) {
    // Instituts
    await queryInterface.removeColumn('instituts', 'suspended_by');
    await queryInterface.removeColumn('instituts', 'suspended_at');
    await queryInterface.removeColumn('instituts', 'suspension_reason');
    await queryInterface.removeColumn('instituts', 'validation_status');

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_instituts_validation_status CASCADE;
    `);

    await queryInterface.changeColumn('instituts', 'nom', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Utilisateurs
    await queryInterface.removeColumn('utilisateurs', 'first_login_completed');
    await queryInterface.removeColumn('utilisateurs', 'first_login_expires_at');
    await queryInterface.removeColumn('utilisateurs', 'first_login_token');

    await queryInterface.changeColumn('utilisateurs', 'mot_de_passe', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
