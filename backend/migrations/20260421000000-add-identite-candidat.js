'use strict'

// ============================================================
// Migration — Ajout des champs identité légale aux candidats
// ============================================================
// Colonnes ajoutées :
//   - nationalite          STRING  NOT NULL  default 'tunisienne'
//   - cin                  STRING  UNIQUE
//   - numero_passeport     STRING  UNIQUE
//   - type_piece_identite  ENUM('cin','passeport')  forcé backend
// ============================================================

module.exports = {

  up: async (queryInterface, Sequelize) => {

    // ── 1. Créer l'ENUM PostgreSQL AVANT la colonne ──────────
    // Idempotent : ne plante pas si l'ENUM existe déjà
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_candidats_type_piece_identite
          AS ENUM ('cin', 'passeport');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // ── 2. Ajouter les colonnes ───────────────────────────────
    await queryInterface.addColumn('candidats', 'nationalite', {
      type         : Sequelize.STRING,
      allowNull    : false,
      defaultValue : 'tunisienne',
    })

    await queryInterface.addColumn('candidats', 'cin', {
      type      : Sequelize.STRING,
      allowNull : true,
    })

    await queryInterface.addColumn('candidats', 'numero_passeport', {
      type      : Sequelize.STRING,
      allowNull : true,
    })

    await queryInterface.addColumn('candidats', 'type_piece_identite', {
      type      : Sequelize.ENUM('cin', 'passeport'),
      allowNull : true,
    })

    // ── 3. Contraintes UNIQUE PostgreSQL propres ──────────────
    // Utiliser addConstraint() plutôt que unique: true dans addColumn
    // pour un rollback propre via removeConstraint()
    await queryInterface.addConstraint('candidats', {
      fields : ['cin'],
      type   : 'unique',
      name   : 'candidats_cin_unique',
    })

    await queryInterface.addConstraint('candidats', {
      fields : ['numero_passeport'],
      type   : 'unique',
      name   : 'candidats_numero_passeport_unique',
    })
  },

  down: async (queryInterface, Sequelize) => {

    // ── Rollback dans l'ordre inverse ─────────────────────────

    // 1. Supprimer les contraintes UNIQUE d'abord
    await queryInterface.removeConstraint(
      'candidats', 'candidats_cin_unique'
    )
    await queryInterface.removeConstraint(
      'candidats', 'candidats_numero_passeport_unique'
    )

    // 2. Supprimer les colonnes
    await queryInterface.removeColumn('candidats', 'type_piece_identite')
    await queryInterface.removeColumn('candidats', 'numero_passeport')
    await queryInterface.removeColumn('candidats', 'cin')
    await queryInterface.removeColumn('candidats', 'nationalite')

    // 3. Supprimer l'ENUM PostgreSQL en dernier
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_candidats_type_piece_identite;
    `)
  },
}
