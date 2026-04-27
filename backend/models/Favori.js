// Modèle Favori — lien entre un Candidat et un Programme mis en favori
module.exports = (sequelize, DataTypes) => {
  const Favori = sequelize.define('Favori', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    candidat_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    programme_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'favoris',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: false,
    indexes: [
      {
        name: 'favoris_candidat_programme_unique',
        unique: true,
        fields: ['candidat_id', 'programme_id'],
      },
    ],
  });

  return Favori;
};
