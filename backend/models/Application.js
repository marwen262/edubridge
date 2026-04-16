// models/Application.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GOVERNORATES_TN = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte',
  'Béja','Jendouba','Le Kef','Siliana','Sousse','Monastir','Mahdia',
  'Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Médenine',
  'Tataouine','Gafsa','Tozeur','Kébili',
];

const currentYear = new Date().getFullYear();

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  // ── Workflow ──────────────────────────────────────────────────────
  status: {
    type: DataTypes.ENUM(
      'pending','pending_admin','pending_institute',
      'pre_accepted','pre_rejected','sent_to_institute',
      'accepted_by_institute','rejected_by_institute',
      'accepted','rejected'
    ),
    defaultValue: 'pending_admin',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // FKs workflow
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  programId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  instituteId: {
    type: DataTypes.UUID,
    allowNull: true,
  },

  // ── Choisissez votre inscription ───────────────────────────────────
  annee_universitaire: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  niveau_demande: {
    type: DataTypes.ENUM(
      '1ère année','2ème année','3ème année','4ème année','5ème année',
      'Master 1','Master 2'
    ),
    allowNull: false,
  },
  mode_etudes: {
    type: DataTypes.ENUM('Présentiel','À distance','Hybride','Alternance'),
    allowNull: false,
  },

  // ── Informations candidat ──────────────────────────────────────────
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  sex: {
    type: DataTypes.ENUM('Homme', 'Femme'),
    allowNull: false,
  },
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  lieu_naissance: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  situation_familiale: {
    type: DataTypes.ENUM('Célibataire','Marié(e)','Divorcé(e)','Veuf(ve)'),
    allowNull: false,
  },
  nationalite: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { isEmail: true },
  },
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { is: /^\+[0-9]{7,15}$/ },
  },

  // ── Pièce d'identité ──────────────────────────────────────────────
  piece_identite_type: {
    type: DataTypes.ENUM('CIN','Passeport','Carte de séjour'),
    allowNull: false,
  },
  piece_identite_numero: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  // ── Adresse ───────────────────────────────────────────────────────
  adresse_pays_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  adresse_gouvernorat: {
    type: DataTypes.ENUM(...GOVERNORATES_TN),
    allowNull: true, // obligatoire si pays = Tunisie, vérifié en controller
  },
  adresse_ville: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  adresse_rue: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  // ── Bac ───────────────────────────────────────────────────────────
  bac_pays_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bac_annee: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1950, max: currentYear },
  },
  bac_section: {
    type: DataTypes.ENUM(
      'Mathématiques','Sciences expérimentales','Sciences techniques',
      'Informatique','Économie et gestion','Lettres','Sport'
    ),
    allowNull: false,
  },

  // ── Dernière étude académique (optionnelle) ────────────────────────
  last_study_pays_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  last_study_etablissement: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  last_study_diplome: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  last_study_specialite: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  last_study_niveau: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  last_study_annee: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1950, max: currentYear },
  },

  // ── Pièces jointes ────────────────────────────────────────────────
  diplomaFileUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  pieceIdentiteFileUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  photoFileUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  // ── Consentement ──────────────────────────────────────────────────
  consent_accepted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    validate: {
      isTrue(value) {
        if (value !== true) throw new Error('Le consentement doit être accepté.');
      },
    },
  },
}, {
  tableName: 'Applications',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['userId'] },
    { fields: ['programId'] },
    { fields: ['instituteId'] },
  ],
});

module.exports = Application;
