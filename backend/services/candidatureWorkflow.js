// services/candidatureWorkflow.js — Moteur de workflow simplifié des candidatures MVP
const { sequelize, Candidature, Programme, Media } = require('../models');
const { Op } = require('sequelize');
const notif = require('./notificationService');

// Statuts terminaux : aucune transition sortante
const STATUTS_TERMINAUX = ['acceptee', 'refusee'];

// Liste exhaustive des valeurs ENUM acceptées côté BDD
const STATUTS_VALIDES = [
  'brouillon', 'soumise', 'en_examen', 'acceptee', 'refusee', 'liste_attente',
];

// Matrice des transitions autorisées par rôle
const TRANSITIONS = {
  candidat: {
    brouillon: ['soumise'],
  },
  institut: {
    soumise:       ['en_examen', 'acceptee', 'refusee', 'liste_attente'],
    en_examen:     ['acceptee', 'refusee', 'liste_attente'],
    liste_attente: ['acceptee', 'refusee'],
  },
};

// ── Helpers privés ─────────────────────────────────────────────────────

// Crée un Media physique à partir d'un fichier multer
async function _creerMedia(file, proprietaire_id, transaction) {
  return Media.create({
    proprietaire_id,
    type_proprietaire: 'Candidat',
    nom_fichier: file.originalname,
    chemin: `uploads/${file.filename}`,
    type_mime: file.mimetype,
    taille_octets: file.size,
  }, { transaction });
}

// Transforme les fichiers multer (multiples champs) en entrées JSONB à pousser dans documents_soumis
// Multer renvoie soit req.files = { code: [file,...] } (fields), soit req.files = [file,...] (array)
async function _fichiersEnDocuments(files, user_id, transaction) {
  if (!files) return [];
  const liste = [];

  // Forme "fields" : objet code → array
  if (!Array.isArray(files) && typeof files === 'object') {
    for (const [nom, arr] of Object.entries(files)) {
      for (const file of arr) {
        const media = await _creerMedia(file, user_id, transaction);
        liste.push({
          nom,
          url: `/uploads/${file.filename}`,
          media_id: media.id,
          telecharge_le: new Date().toISOString(),
        });
      }
    }
    return liste;
  }

  // Forme "array" : simple tableau de fichiers
  for (const file of files) {
    const media = await _creerMedia(file, user_id, transaction);
    liste.push({
      nom: file.fieldname || file.originalname,
      url: `/uploads/${file.filename}`,
      media_id: media.id,
      telecharge_le: new Date().toISOString(),
    });
  }
  return liste;
}

// ── Validations métier ────────────────────────────────────────────────

// Vérifie qu'une transition de statut est autorisée pour un rôle donné
function validerTransition(role, statut_actuel, statut_cible) {
  if (!STATUTS_VALIDES.includes(statut_cible)) {
    throw {
      status: 400,
      message: `Statut « ${statut_cible} » invalide. Valeurs autorisées : ${STATUTS_VALIDES.join(', ')}.`,
    };
  }
  if (STATUTS_TERMINAUX.includes(statut_actuel)) {
    throw { status: 400, message: `Statut terminal « ${statut_actuel} » : aucune transition autorisée.` };
  }
  if (role === 'admin') return; // admin peut tout (sauf valeur ENUM invalide, déjà rejetée)
  const permises = TRANSITIONS[role]?.[statut_actuel] || [];
  if (!permises.includes(statut_cible)) {
    throw {
      status: 400,
      message: `Transition ${statut_actuel} → ${statut_cible} non autorisée pour le rôle ${role}.`,
    };
  }
}

// Vérifie la complétude documentaire d'une candidature.
// Source de vérité : programme.documents_requis (JSONB [{nom, obligatoire, label?}]).
// Retourne { complet, manquants: string[], details: {nom, label}[] }.
async function verifierCompletude(candidature) {
  const programme = await Programme.findByPk(candidature.programme_id, {
    attributes: ['id', 'titre', 'niveau', 'documents_requis'],
  });

  if (!programme) {
    throw {
      status: 404,
      message: `Programme (id: ${candidature.programme_id}) introuvable — vérification impossible.`,
    };
  }

  const documentsRequis = programme.documents_requis;

  // Aucune liste définie → programme sans pré-requis documentaires
  if (!Array.isArray(documentsRequis) || documentsRequis.length === 0) {
    return { complet: true, manquants: [], details: [] };
  }

  // Sanity check structurel : chaque entrée doit avoir un champ nom valide
  const entreesMalformees = documentsRequis.filter(
    (d) => !d || typeof d.nom !== 'string' || d.nom.trim() === ''
  );
  if (entreesMalformees.length > 0) {
    throw {
      status: 500,
      message: `Configuration invalide : documents_requis du programme « ${programme.titre} » contient ${entreesMalformees.length} entrée(s) sans champ "nom".`,
    };
  }

  const obligatoires = documentsRequis.filter((d) => d.obligatoire === true);

  // Lookup O(1) sur noms normalisés des documents soumis
  const nomsDocumentsSoumis = new Set(
    (candidature.documents_soumis || [])
      .filter((d) => d && typeof d.nom === 'string')
      .map((d) => d.nom.trim().toLowerCase())
  );

  const manquants = obligatoires.filter(
    (d) => !nomsDocumentsSoumis.has(d.nom.trim().toLowerCase())
  );

  return {
    complet: manquants.length === 0,
    manquants: manquants.map((d) => d.nom),
    details: manquants.map((d) => ({ nom: d.nom, label: d.label || d.nom })),
  };
}

// Vérifie qu'aucune autre candidature active n'existe pour ce couple (candidat, programme)
async function verifierDoublon(candidat_id, programme_id, exclude_id) {
  const where = { candidat_id, programme_id };
  if (exclude_id) where.id = { [Op.ne]: exclude_id };
  const existing = await Candidature.findOne({ where });
  if (existing) {
    throw { status: 409, message: 'Vous avez déjà une candidature pour ce programme.' };
  }
}

// Vérifie que le programme est actif et accessible aux candidatures
async function verifierProgrammeActif(programme_id) {
  const programme = await Programme.findByPk(programme_id, {
    attributes: ['id', 'est_actif', 'titre'],
  });
  if (!programme) throw { status: 404, message: 'Programme introuvable.' };
  if (!programme.est_actif) {
    throw { status: 400, message: 'Ce programme n\'est pas ouvert aux candidatures.' };
  }
  return programme;
}

// ── Opérations métier ────────────────────────────────────────────────

// Crée un brouillon de candidature (avec éventuels documents initiaux)
exports.creerBrouillon = async ({ candidat_id, programme_id, lettre_motivation, files, user_id }) => {
  await verifierProgrammeActif(programme_id);
  await verifierDoublon(candidat_id, programme_id);

  return sequelize.transaction(async (t) => {
    const documents_soumis = await _fichiersEnDocuments(files, user_id, t);

    const candidature = await Candidature.create({
      candidat_id,
      programme_id,
      statut: 'brouillon',
      lettre_motivation,
      documents_soumis,
    }, { transaction: t });

    return candidature;
  });
};

// Met à jour un brouillon existant (lettre + ajout de documents)
exports.mettreAJourBrouillon = async ({ candidature_id, lettre_motivation, files, user_id }) => {
  const candidature = await Candidature.findByPk(candidature_id);
  if (!candidature) throw { status: 404, message: 'Candidature introuvable.' };
  if (candidature.statut !== 'brouillon') {
    throw { status: 400, message: 'Seul un brouillon peut être modifié librement.' };
  }

  return sequelize.transaction(async (t) => {
    const maj = {};
    if (lettre_motivation !== undefined) maj.lettre_motivation = lettre_motivation;

    const nouveaux = await _fichiersEnDocuments(files, user_id, t);
    if (nouveaux.length > 0) {
      maj.documents_soumis = [...(candidature.documents_soumis || []), ...nouveaux];
    }
    if (Object.keys(maj).length > 0) {
      await candidature.update(maj, { transaction: t });
    }
    return candidature.reload({ transaction: t });
  });
};

// Soumet le brouillon : valide la complétude des documents puis passe en statut 'soumise'
exports.soumettre = async ({ candidature_id, user_id }) => {
  const candidature = await Candidature.findByPk(candidature_id);
  if (!candidature) throw { status: 404, message: 'Candidature introuvable.' };

  validerTransition('candidat', candidature.statut, 'soumise');

  const { complet, manquants, details } = await verifierCompletude(candidature);
  if (!complet) {
    throw {
      status: 400,
      message: `Documents obligatoires manquants : ${details.map((d) => d.label).join(', ')}.`,
      manquants,
      details,
    };
  }

  const ancien_statut = candidature.statut;

  return sequelize.transaction(async (t) => {
    await candidature.update({
      statut: 'soumise',
      soumise_le: new Date(),
    }, { transaction: t });

    await notif.notifierChangementStatut(candidature, ancien_statut, 'soumise', t);
    await notif.notifierNouvelleCandidate(candidature, t);

    return candidature;
  });
};

// Transition de statut demandée par l'institut ou l'admin
exports.changerStatut = async ({ candidature_id, statut_cible, user_id, role, notes_institut }) => {
  const candidature = await Candidature.findByPk(candidature_id, {
    include: [{ model: Programme, as: 'programme', attributes: ['id', 'institut_id'] }],
  });
  if (!candidature) throw { status: 404, message: 'Candidature introuvable.' };

  validerTransition(role, candidature.statut, statut_cible);

  const ancien_statut = candidature.statut;
  const maj = { statut: statut_cible };
  if (notes_institut !== undefined) maj.notes_institut = notes_institut;

  return sequelize.transaction(async (t) => {
    await candidature.update(maj, { transaction: t });
    await notif.notifierChangementStatut(candidature, ancien_statut, statut_cible, t);
    return candidature;
  });
};

// ── Exports utilitaires ────────────────────────────────────────────────

exports.STATUTS_TERMINAUX = STATUTS_TERMINAUX;
exports.TRANSITIONS = TRANSITIONS;
exports.validerTransition = validerTransition;
exports.verifierCompletude = verifierCompletude;
exports.verifierDoublon = verifierDoublon;
