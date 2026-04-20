// models/index.js — Chargement des 8 modèles MVP et déclaration des associations
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// ── Chargement des modèles (factory pattern) ──────────────────────────
const Utilisateur  = require('./Utilisateur')(sequelize, DataTypes);
const Candidat     = require('./Candidat')(sequelize, DataTypes);
const Institut     = require('./Institut')(sequelize, DataTypes);
const Programme    = require('./Programme')(sequelize, DataTypes);
const Candidature  = require('./Candidature')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const Media        = require('./Media')(sequelize, DataTypes);
const Favori       = require('./Favori')(sequelize, DataTypes);

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
};
