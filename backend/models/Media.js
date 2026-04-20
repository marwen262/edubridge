// Modèle Media — fichier uploadé (polymorphique : appartient à un Candidat ou un Institut)
module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define('Media', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    proprietaire_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // 'Candidat' | 'Institut'
    type_proprietaire: { type: DataTypes.STRING, allowNull: true },
    nom_fichier: { type: DataTypes.STRING, allowNull: true },
    chemin: { type: DataTypes.STRING, allowNull: true },
    type_mime: { type: DataTypes.STRING, allowNull: true },
    taille_octets: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'medias',
    timestamps: true,
    createdAt: 'telecharge_le',
    updatedAt: false,
  });

  return Media;
};
