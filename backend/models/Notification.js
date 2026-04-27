// Modèle Notification — message applicatif adressé à un Utilisateur
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    utilisateur_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'statut_candidature', 'nouveau_programme',
        'document_manquant', 'rappel_echeance', 'systeme'
      ),
      allowNull: false,
    },
    titre: { type: DataTypes.STRING, allowNull: true },
    contenu: { type: DataTypes.TEXT, allowNull: true },
    est_lue: { type: DataTypes.BOOLEAN, defaultValue: false },
    // Référence polymorphique vers l'entité liée (Candidature, Programme, etc.)
    ref_id: { type: DataTypes.UUID, allowNull: true },
    ref_type: { type: DataTypes.STRING, allowNull: true },
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: false,
  });

  return Notification;
};
