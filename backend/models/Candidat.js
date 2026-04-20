// Modèle Candidat — profil d'un candidat (étudiant) lié à un Utilisateur
module.exports = (sequelize, DataTypes) => {
  const Candidat = sequelize.define('Candidat', {
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
    prenom: { type: DataTypes.STRING, allowNull: true },
    nom: { type: DataTypes.STRING, allowNull: true },
    date_naissance: { type: DataTypes.DATEONLY, allowNull: true },
    genre: { type: DataTypes.ENUM('homme', 'femme'), allowNull: true },
    telephone: { type: DataTypes.STRING, allowNull: true },
    // { rue, ville, gouvernorat, code_postal, pays }
    adresse: { type: DataTypes.JSONB, allowNull: true },
    situation_familiale: {
      type: DataTypes.ENUM('celibataire', 'marie', 'divorce', 'veuf'),
      allowNull: true,
    },
    type_bac: {
      type: DataTypes.ENUM(
        'mathematiques', 'sciences', 'technique',
        'economie', 'lettres', 'sport'
      ),
      allowNull: true,
    },
    moyenne_bac: { type: DataTypes.FLOAT, allowNull: true },
    annee_bac: { type: DataTypes.INTEGER, allowNull: true },
    // Ex : ['français', 'anglais', 'arabe']
    langues: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    // [{ diplome, etablissement, annee, mention }]
    parcours_academique: { type: DataTypes.JSONB, allowNull: true },
    niveau_actuel: {
      type: DataTypes.ENUM('terminale', 'bac', 'licence', 'master'),
      allowNull: true,
    },
    photo_profil: { type: DataTypes.STRING, allowNull: true },
  }, {
    tableName: 'candidats',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: 'mis_a_jour_le',
  });

  return Candidat;
};
