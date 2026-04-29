// Modèle Utilisateur — compte d'authentification (candidat, institut ou admin)
module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define('Utilisateur', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    // Nullable : les comptes instituts invités n'ont pas encore de mot de passe
    mot_de_passe: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('candidat', 'institut', 'admin'),
      allowNull: false,
    },
    jeton_rafraichissement: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Token à usage unique envoyé par email pour le first login
    first_login_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Expiration du token (24h par défaut)
    first_login_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // false pour les comptes invités qui n'ont pas encore complété le first login
    first_login_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // Token à usage unique pour réinitialisation de mot de passe
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Expiration du token de reset (1h par défaut)
    reset_password_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'utilisateurs',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: 'mis_a_jour_le',
  });

  return Utilisateur;
};
