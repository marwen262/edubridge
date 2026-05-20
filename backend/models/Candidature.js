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

    // Format attendu dans notes_institut :
    // [DiplomaVerifier] score=82/100, niveau=high, cf=80, struct=85, vis=75, fraud=10
    //   cf     = critical_fields_score
    //   struct = structure_score
    //   vis    = visual_authenticity_score
    //   fraud  = tampering.fraud_score (0=aucune anomalie, 100=très suspect)

    // Score global (backward compatible)
    score_diplome: {
      type: DataTypes.VIRTUAL,
      get() {
        const s = this.getDataValue('scores_diplome');
        return s ? s.global : null;
      },
    },

    // Tous les scores DiplomaVerifier : { global, niveau, cf, struct, vis }
    scores_diplome: {
      type: DataTypes.VIRTUAL,
      get() {
        const notes = this.getDataValue('notes_institut');
        if (!notes) return null;

        // Format enrichi V7 avec sous-scores (fraud optionnel)
        const full = notes.match(
          /\[DiplomaVerifier\] score=(\d+)\/100, niveau=(\w+), cf=(\d+), struct=(\d+), vis=(\d+)(?:, fraud=(\d+))?/
        );
        if (full) {
          return {
            global: parseInt(full[1], 10),
            niveau: full[2],
            cf:     parseInt(full[3], 10),
            struct: parseInt(full[4], 10),
            vis:    parseInt(full[5], 10),
            fraud:  full[6] !== undefined ? parseInt(full[6], 10) : null,
          };
        }

        // Fallback : ancien format sans sous-scores
        const legacy = notes.match(/\[DiplomaVerifier\] score=(\d+)\/100/);
        if (legacy) {
          return {
            global: parseInt(legacy[1], 10),
            niveau: null,
            cf:     null,
            struct: null,
            vis:    null,
          };
        }

        return null;
      },
    },
  }, {
    tableName: 'candidatures',
    timestamps: true,
    createdAt: 'cree_le',
    updatedAt: 'mis_a_jour_le',
  });

  return Candidature;
};
