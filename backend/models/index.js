// models/index.js – Chargement de tous les modèles + déclaration des associations
const sequelize = require('../config/database');

const Country     = require('./Country');
const User        = require('./User');
const Institute   = require('./Institute');
const Program     = require('./Program');
const Application = require('./Application');
const Favorite    = require('./Favorite');
const Historique  = require('./Historique');

// ── Associations ──────────────────────────────────────────────────────

// User ↔ Country
User.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
Country.hasMany(User,   { foreignKey: 'countryId' });

// User ↔ Institute (l'utilisateur propriétaire de l'établissement)
User.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute', constraints: false });

// Institute ↔ User (creator/owner)
Institute.belongsTo(User,    { foreignKey: 'userId', as: 'owner' });
Institute.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
Country.hasMany(Institute,   { foreignKey: 'countryId' });

// Institute ↔ Programs
Institute.hasMany(Program, { foreignKey: 'instituteId', as: 'programs', onDelete: 'CASCADE' });
Program.belongsTo(Institute, { foreignKey: 'instituteId', as: 'institute' });

// Program ↔ Applications
Program.hasMany(Application, { foreignKey: 'programId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Program, { foreignKey: 'programId', as: 'program' });

// Application ↔ User
User.hasMany(Application,       { foreignKey: 'userId', as: 'applications' });
Application.belongsTo(User,     { foreignKey: 'userId', as: 'user' });

// Application ↔ Institute
Institute.hasMany(Application,      { foreignKey: 'instituteId', as: 'applications' });
Application.belongsTo(Institute,    { foreignKey: 'instituteId', as: 'institute' });

// Favorite ↔ User & Program
User.hasMany(Favorite,      { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User,    { foreignKey: 'userId', as: 'user' });

Program.hasMany(Favorite,   { foreignKey: 'programId', as: 'favorites' });
Favorite.belongsTo(Program, { foreignKey: 'programId', as: 'program' });

// ─────────────────────────────────────────────────────────────────────

module.exports = {
  sequelize,
  Country,
  User,
  Institute,
  Program,
  Application,
  Favorite,
  Historique,
};
