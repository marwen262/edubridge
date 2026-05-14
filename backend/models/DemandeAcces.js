'use strict';
const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class DemandeAcces extends Model {}
  DemandeAcces.init({
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nom:          { type: DataTypes.STRING(255), allowNull: false },
    email:        { type: DataTypes.STRING(255), allowNull: false, unique: true },
    telephone:    { type: DataTypes.STRING(30), allowNull: false },
    presentation: { type: DataTypes.TEXT, allowNull: false },
    statut:       { type: DataTypes.ENUM('en_attente','approuvee','rejetee'), allowNull: false, defaultValue: 'en_attente' },
    notes_admin:  { type: DataTypes.TEXT, allowNull: true },
    traite_par:   { type: DataTypes.UUID, allowNull: true },
    traite_le:    { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'DemandeAcces',
    tableName: 'demandes_acces',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: 'mis_a_jour_le',
  });
  return DemandeAcces;
};
