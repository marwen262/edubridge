'use strict';
module.exports = (sequelize, DataTypes) => {
  const PreInscription = sequelize.define('PreInscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    candidature_id:        { type: DataTypes.UUID, allowNull: false, unique: true },
    candidat_id:           { type: DataTypes.UUID, allowNull: false },
    institut_id:           { type: DataTypes.UUID, allowNull: false },
    programme_id:          { type: DataTypes.UUID, allowNull: false },
    adresse_complete:      { type: DataTypes.STRING(500), allowNull: true },
    ville:                 { type: DataTypes.STRING(100), allowNull: true },
    pays:                  { type: DataTypes.STRING(100), allowNull: true },
    code_postal:           { type: DataTypes.STRING(20),  allowNull: true },
    telephone:             { type: DataTypes.STRING(30),  allowNull: true },
    date_naissance:        { type: DataTypes.DATEONLY,    allowNull: true },
    nationalite:           { type: DataTypes.STRING(100), allowNull: true },
    type_piece_identite:   { type: DataTypes.STRING(50),  allowNull: true },
    numero_piece_identite: { type: DataTypes.STRING(50),  allowNull: true },
    photo_identite_url:    { type: DataTypes.STRING(500), allowNull: true },
    statut: {
      type: DataTypes.ENUM('en_attente', 'completee'),
      allowNull: false,
      defaultValue: 'en_attente',
    },
    completee_le: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'PreInscription',
    tableName:  'pre_inscriptions',
    timestamps: true,
    createdAt:  'cree_le',
    updatedAt:  'mis_a_jour_le',
  });
  return PreInscription;
};
