// Modèle Programme — formation proposée par un Institut
module.exports = (sequelize, DataTypes) => {
  const Programme = sequelize.define('Programme', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    institut_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    titre: { type: DataTypes.STRING, allowNull: false },
    domaine: {
      type: DataTypes.ENUM(
        'informatique', 'genie_civil', 'electrique',
        'mecanique', 'chimie', 'agronomie',
        'finance', 'management'
      ),
      allowNull: true,
    },
    niveau: {
      type: DataTypes.ENUM('licence', 'master', 'ingenieur', 'doctorat'),
      allowNull: true,
    },
    mode: {
      type: DataTypes.ENUM('presentiel', 'distanciel', 'hybride'),
      allowNull: true,
    },
    duree_annees: { type: DataTypes.INTEGER, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    // [{ nom, obligatoire: bool }]
    documents_requis: { type: DataTypes.JSONB, allowNull: true },
    // { moyenne_min, matieres: [], types_bac: [] }
    prerequis: { type: DataTypes.JSONB, allowNull: true },
    frais_inscription: { type: DataTypes.FLOAT, allowNull: true },
    date_limite_candidature: { type: DataTypes.DATEONLY, allowNull: true },
    capacite: { type: DataTypes.INTEGER, allowNull: true },
    est_actif: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'programmes',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: 'mis_a_jour_le',
  });

  return Programme;
};
