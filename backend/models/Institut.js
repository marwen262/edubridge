// Modèle Institut — profil d'une école d'ingénieurs lié à un Utilisateur
module.exports = (sequelize, DataTypes) => {
  const Institut = sequelize.define('Institut', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    utilisateur_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    nom: { type: DataTypes.STRING, allowNull: false },
    sigle: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    site_web: { type: DataTypes.STRING, allowNull: true },
    logo: { type: DataTypes.STRING, allowNull: true },
    // { rue, ville, gouvernorat, pays }
    adresse: { type: DataTypes.JSONB, allowNull: true },
    // Ex : ['CTI', 'ABET', 'ENAEE']
    accreditations: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    // { telephone, email, fax }
    contact: { type: DataTypes.JSONB, allowNull: true },
    est_verifie: { type: DataTypes.BOOLEAN, defaultValue: false },
    note: { type: DataTypes.FLOAT, allowNull: true },
    image_couverture: { type: DataTypes.STRING, allowNull: true },
    taux_acceptation: { type: DataTypes.FLOAT, allowNull: true },
    nombre_etudiants: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'instituts',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: 'mis_a_jour_le',
  });

  return Institut;
};
