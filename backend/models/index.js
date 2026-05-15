// models/index.js — Chargement des 10 modèles et déclaration des associations
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// ── Chargement des modèles (factory pattern) ──────────────────────────
const Utilisateur    = require('./Utilisateur')(sequelize, DataTypes);
const Candidat       = require('./Candidat')(sequelize, DataTypes);
const Institut       = require('./Institut')(sequelize, DataTypes);
const Programme      = require('./Programme')(sequelize, DataTypes);
const Candidature    = require('./Candidature')(sequelize, DataTypes);
const Notification   = require('./Notification')(sequelize, DataTypes);
const Media          = require('./Media')(sequelize, DataTypes);
const Favori         = require('./Favori')(sequelize, DataTypes);
const DemandeAcces   = require('./DemandeAcces')(sequelize, DataTypes);
const PreInscription = require('./PreInscription')(sequelize, DataTypes);

// ── Associations ──────────────────────────────────────────────────────

// --- Utilisateur ↔ Candidat / Institut ---
Utilisateur.hasOne(Candidat, { foreignKey: 'utilisateur_id', as: 'candidat', onDelete: 'CASCADE' });
Candidat.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

Utilisateur.hasOne(Institut, { foreignKey: 'utilisateur_id', as: 'institut', onDelete: 'CASCADE' });
Institut.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

// --- Institut → Programme ---
Institut.hasMany(Programme, { foreignKey: 'institut_id', as: 'programmes', onDelete: 'CASCADE' });
Programme.belongsTo(Institut, { foreignKey: 'institut_id', as: 'institut' });

// --- Candidat → Candidature ← Programme ---
Candidat.hasMany(Candidature, { foreignKey: 'candidat_id', as: 'candidatures', onDelete: 'CASCADE' });
Programme.hasMany(Candidature, { foreignKey: 'programme_id', as: 'candidatures', onDelete: 'CASCADE' });
Candidature.belongsTo(Candidat, { foreignKey: 'candidat_id', as: 'candidat' });
Candidature.belongsTo(Programme, { foreignKey: 'programme_id', as: 'programme' });

// --- Utilisateur → Notification ---
Utilisateur.hasMany(Notification, { foreignKey: 'utilisateur_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(Utilisateur, { foreignKey: 'utilisateur_id', as: 'utilisateur' });

// --- Candidat ↔ Programme (via Favori) ---
Candidat.hasMany(Favori, { foreignKey: 'candidat_id', as: 'favoris', onDelete: 'CASCADE' });
Programme.hasMany(Favori, { foreignKey: 'programme_id', as: 'favorisPar', onDelete: 'CASCADE' });
Favori.belongsTo(Candidat, { foreignKey: 'candidat_id', as: 'candidat' });
Favori.belongsTo(Programme, { foreignKey: 'programme_id', as: 'programme' });

// --- Media (polymorphique : Candidat ou Institut) ---
Candidat.hasMany(Media, {
  foreignKey: 'proprietaire_id',
  constraints: false,
  scope: { type_proprietaire: 'Candidat' },
  as: 'medias',
});
Institut.hasMany(Media, {
  foreignKey: 'proprietaire_id',
  constraints: false,
  scope: { type_proprietaire: 'Institut' },
  as: 'medias',
});
Media.belongsTo(Candidat, {
  foreignKey: 'proprietaire_id',
  constraints: false,
  as: 'candidatProprietaire',
});
Media.belongsTo(Institut, {
  foreignKey: 'proprietaire_id',
  constraints: false,
  as: 'institutProprietaire',
});

// --- DemandeAcces → Utilisateur (admin qui a traité) ---
DemandeAcces.belongsTo(Utilisateur, {
  foreignKey: 'traite_par',
  as: 'admin',
  onDelete: 'SET NULL',
});

// --- PreInscription (1:1 Candidature, N:1 Candidat / Institut / Programme) ---
Candidature.hasOne(PreInscription, { foreignKey: 'candidature_id', as: 'preInscription', onDelete: 'CASCADE' });
PreInscription.belongsTo(Candidature, { foreignKey: 'candidature_id', as: 'candidature' });
PreInscription.belongsTo(Candidat,    { foreignKey: 'candidat_id',    as: 'candidat' });
PreInscription.belongsTo(Institut,    { foreignKey: 'institut_id',    as: 'institut' });
PreInscription.belongsTo(Programme,   { foreignKey: 'programme_id',   as: 'programme' });

// ── Export ─────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  Utilisateur,
  Candidat,
  Institut,
  Programme,
  Candidature,
  Notification,
  Media,
  Favori,
  DemandeAcces,
  PreInscription,
};
