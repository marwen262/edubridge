// models/Pays.js — Hiérarchie géographique : niveau pays
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Pays', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    nomLocal: { type: DataTypes.STRING(100), allowNull: true },
    codeIso2: { type: DataTypes.CHAR(2), allowNull: false, unique: true },
    codeIso3: { type: DataTypes.CHAR(3), allowNull: false, unique: true },
    indicatifTel: { type: DataTypes.STRING(8), allowNull: false },
    drapeauUrl: { type: DataTypes.TEXT, allowNull: true },
    estActif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, { tableName: 'Pays', timestamps: true, underscored: false });
};
