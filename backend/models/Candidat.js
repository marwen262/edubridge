// Modèle Candidat — profil d'un candidat (étudiant) lié à un Utilisateur

// Valeur de référence pour la nationalité tunisienne.
// Utiliser cette constante dans le hook pour absorber
// les variations futures de l'API externe pays
// (casse, espaces, formats différents).
const NATIONALITE_TUNISIENNE = 'tunisienne';

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

    // ── Identité légale ─────────────────────────────────────
    nationalite: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'tunisienne',
      // STRING intentionnel : une API externe de gestion
      // des pays sera intégrée en future.
      // La comparaison est normalisée via .toLowerCase().trim()
      // dans le hook beforeValidate.
    },

    cin: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: {
          args: /^[0-9]{8}$/,
          msg: 'Le CIN doit contenir exactement 8 chiffres.',
        },
      },
    },

    numero_passeport: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        len: {
          args: [6, 20],
          msg: 'Le numéro de passeport doit contenir entre 6 et 20 caractères.',
        },
        is: {
          args: /^[A-Za-z0-9]+$/,
          msg: 'Le passeport ne doit contenir que des lettres et chiffres.',
        },
      },
    },

    type_piece_identite: {
      type: DataTypes.ENUM('cin', 'passeport'),
      allowNull: true,
      // Jamais modifiable directement via API.
      // Toujours forcé par le hook beforeValidate.
    },
  }, {
    tableName: 'candidats',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: 'mis_a_jour_le',
    hooks: {
      beforeValidate: (candidat, options) => {
        // Ne déclencher la validation identité QUE si
        // un des champs concernés est modifié.
        // Évite de bloquer les updates partiels sans rapport
        // (ex: mise à jour prénom uniquement).
        const champsIdentiteModifies =
          candidat.changed('nationalite') ||
          candidat.changed('cin') ||
          candidat.changed('numero_passeport');

        if (!champsIdentiteModifies) return;

        // Normalisation : absorbe les variations de casse et espaces
        // venant d'une API externe pays future
        // ex: 'Tunisienne', 'TUNISIENNE', ' tunisienne ' → match correct
        const estTunisien =
          candidat.nationalite?.toLowerCase().trim() === NATIONALITE_TUNISIENNE;

        if (estTunisien) {
          // Candidat tunisien → CIN obligatoire
          if (!candidat.cin) {
            throw new Error(
              'CIN obligatoire pour un candidat de nationalité tunisienne.'
            );
          }

          // Forcer cohérence — jamais modifiable via API
          candidat.type_piece_identite = 'cin';
          candidat.numero_passeport = null;
        } else {
          // Candidat international → Passeport obligatoire
          if (!candidat.numero_passeport) {
            throw new Error(
              'Numéro de passeport obligatoire pour un candidat international.'
            );
          }

          // Forcer cohérence — jamais modifiable via API
          candidat.type_piece_identite = 'passeport';
          candidat.cin = null;
        }

        // save() fige options.fields depuis this.changed() AVANT beforeValidate.
        // Les champs que ce hook mute (type_piece_identite, cin, numero_passeport)
        // seraient donc exclus du UPDATE SQL. On les ré-injecte ici pour
        // garantir leur persistance, quel que soit l'appelant.
        if (options && Array.isArray(options.fields)) {
          for (const f of ['type_piece_identite', 'cin', 'numero_passeport']) {
            if (!options.fields.includes(f)) options.fields.push(f);
          }
        }
      },
    },
  });

  return Candidat;
};
