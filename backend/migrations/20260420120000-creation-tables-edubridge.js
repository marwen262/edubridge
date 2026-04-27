'use strict';

// Migration unique — création des 8 tables du MVP EduBridge
// Ordre strict (contraintes FK) :
//   utilisateurs → candidats → instituts → programmes → candidatures → notifications → medias → favoris

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── utilisateurs ───────────────────────────────────────────────────
    await queryInterface.createTable('utilisateurs', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      mot_de_passe: { type: Sequelize.STRING, allowNull: false },
      role: {
        type: Sequelize.ENUM('candidat', 'institut', 'admin'),
        allowNull: false,
      },
      jeton_rafraichissement: { type: Sequelize.STRING, allowNull: true },
      est_actif: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      cree_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      mis_a_jour_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // ── candidats ──────────────────────────────────────────────────────
    await queryInterface.createTable('candidats', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      utilisateur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      prenom: { type: Sequelize.STRING, allowNull: true },
      nom: { type: Sequelize.STRING, allowNull: true },
      date_naissance: { type: Sequelize.DATEONLY, allowNull: true },
      genre: { type: Sequelize.ENUM('homme', 'femme'), allowNull: true },
      telephone: { type: Sequelize.STRING, allowNull: true },
      adresse: { type: Sequelize.JSONB, allowNull: true },
      situation_familiale: {
        type: Sequelize.ENUM('celibataire', 'marie', 'divorce', 'veuf'),
        allowNull: true,
      },
      type_bac: {
        type: Sequelize.ENUM(
          'mathematiques', 'sciences', 'technique',
          'economie', 'lettres', 'sport'
        ),
        allowNull: true,
      },
      moyenne_bac: { type: Sequelize.FLOAT, allowNull: true },
      annee_bac: { type: Sequelize.INTEGER, allowNull: true },
      langues: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      parcours_academique: { type: Sequelize.JSONB, allowNull: true },
      niveau_actuel: {
        type: Sequelize.ENUM('terminale', 'bac', 'licence', 'master'),
        allowNull: true,
      },
      photo_profil: { type: Sequelize.STRING, allowNull: true },
      cree_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      mis_a_jour_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // ── instituts ──────────────────────────────────────────────────────
    await queryInterface.createTable('instituts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      utilisateur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      nom: { type: Sequelize.STRING, allowNull: false },
      sigle: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      site_web: { type: Sequelize.STRING, allowNull: true },
      logo: { type: Sequelize.STRING, allowNull: true },
      adresse: { type: Sequelize.JSONB, allowNull: true },
      accreditations: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
      contact: { type: Sequelize.JSONB, allowNull: true },
      est_verifie: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      note: { type: Sequelize.FLOAT, allowNull: true },
      cree_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      mis_a_jour_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // ── programmes ─────────────────────────────────────────────────────
    await queryInterface.createTable('programmes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      institut_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'instituts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      titre: { type: Sequelize.STRING, allowNull: false },
      domaine: {
        type: Sequelize.ENUM(
          'informatique', 'genie_civil', 'electrique',
          'mecanique', 'chimie', 'agronomie',
          'finance', 'management'
        ),
        allowNull: true,
      },
      niveau: {
        type: Sequelize.ENUM(
          'cycle_preparatoire', 'licence', 'master', 'ingenieur'
        ),
        allowNull: true,
      },
      mode: {
        type: Sequelize.ENUM(
          'cours_du_jour', 'cours_du_soir', 'alternance', 'formation_continue'
        ),
        allowNull: true,
      },
      duree_annees: { type: Sequelize.INTEGER, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      documents_requis: { type: Sequelize.JSONB, allowNull: true },
      prerequis: { type: Sequelize.JSONB, allowNull: true },
      frais_inscription: { type: Sequelize.FLOAT, allowNull: true },
      date_limite_candidature: { type: Sequelize.DATEONLY, allowNull: true },
      capacite: { type: Sequelize.INTEGER, allowNull: true },
      est_actif: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
      cree_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      mis_a_jour_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // ── candidatures ───────────────────────────────────────────────────
    await queryInterface.createTable('candidatures', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      candidat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'candidats', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      programme_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'programmes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      statut: {
        type: Sequelize.ENUM(
          'brouillon', 'soumise', 'en_examen',
          'acceptee', 'refusee', 'liste_attente'
        ),
        defaultValue: 'brouillon',
        allowNull: false,
      },
      documents_soumis: { type: Sequelize.JSONB, allowNull: true },
      lettre_motivation: { type: Sequelize.TEXT, allowNull: true },
      notes_institut: { type: Sequelize.TEXT, allowNull: true },
      soumise_le: { type: Sequelize.DATE, allowNull: true },
      cree_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      mis_a_jour_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // ── notifications ──────────────────────────────────────────────────
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      utilisateur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'utilisateurs', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'statut_candidature', 'nouveau_programme',
          'document_manquant', 'rappel_echeance', 'systeme'
        ),
        allowNull: false,
      },
      titre: { type: Sequelize.STRING, allowNull: true },
      contenu: { type: Sequelize.TEXT, allowNull: true },
      est_lue: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      ref_id: { type: Sequelize.UUID, allowNull: true },
      ref_type: { type: Sequelize.STRING, allowNull: true },
      cree_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // ── medias ─────────────────────────────────────────────────────────
    await queryInterface.createTable('medias', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      proprietaire_id: { type: Sequelize.UUID, allowNull: false },
      type_proprietaire: { type: Sequelize.STRING, allowNull: true },
      nom_fichier: { type: Sequelize.STRING, allowNull: true },
      chemin: { type: Sequelize.STRING, allowNull: true },
      type_mime: { type: Sequelize.STRING, allowNull: true },
      taille_octets: { type: Sequelize.INTEGER, allowNull: true },
      telecharge_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // ── favoris ────────────────────────────────────────────────────────
    await queryInterface.createTable('favoris', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      candidat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'candidats', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      programme_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'programmes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      cree_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Contrainte d'unicité : un candidat ne peut favoriser un programme qu'une fois
    await queryInterface.addIndex('favoris', ['candidat_id', 'programme_id'], {
      unique: true,
      name: 'favoris_candidat_programme_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop dans l'ordre inverse (respect des FK)
    await queryInterface.dropTable('favoris');
    await queryInterface.dropTable('medias');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('candidatures');
    await queryInterface.dropTable('programmes');
    await queryInterface.dropTable('instituts');
    await queryInterface.dropTable('candidats');
    await queryInterface.dropTable('utilisateurs');

    // Suppression explicite des types ENUM Postgres créés par sequelize
    const enums = [
      'enum_utilisateurs_role',
      'enum_candidats_genre',
      'enum_candidats_situation_familiale',
      'enum_candidats_type_bac',
      'enum_candidats_niveau_actuel',
      'enum_programmes_domaine',
      'enum_programmes_niveau',
      'enum_programmes_mode',
      'enum_candidatures_statut',
      'enum_notifications_type',
    ];
    for (const name of enums) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${name}" CASCADE;`);
    }
  },
};
