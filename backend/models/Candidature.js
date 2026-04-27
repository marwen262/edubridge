// Modèle Candidature — dossier de candidature d'un Candidat à un Programme
module.exports = (sequelize, DataTypes) => {
  const Candidature = sequelize.define('Candidature', {
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
    statut: {
      type: DataTypes.ENUM(
        'brouillon', 'soumise', 'en_examen',
        'acceptee', 'refusee', 'liste_attente'
      ),
      defaultValue: 'brouillon',
      allowNull: false,
    },
    // [{ nom, url, telecharge_le }]
    documents_soumis: { type: DataTypes.JSONB, allowNull: true },
    lettre_motivation: { type: DataTypes.TEXT, allowNull: true },
    notes_institut: { type: DataTypes.TEXT, allowNull: true },
    soumise_le: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'candidatures',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: 'mis_a_jour_le',
  });

  return Candidature;
};
