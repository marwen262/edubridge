// services/candidatureWorkflow.js — Moteur de workflow simplifié des candidatures MVP
const { sequelize, Candidature, Candidat, Programme, Media } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const notif = require('./notificationService');
const { verifierDiplome, NOMS_DIPLOMES } = require('./diplomaVerifierService');

// Champs du profil Candidat que la soumission peut mettre à jour.
// Whitelist explicite : on n'accepte JAMAIS d'autres champs depuis req.body
// (évite l'élévation de privilèges via mass-assignment).
const CHAMPS_PROFIL_AUTORISES = [
  'prenom', 'nom', 'date_naissance', 'genre', 'telephone', 'adresse',
  'nationalite', 'cin', 'numero_passeport',
  'situation_familiale', 'type_bac', 'moyenne_bac', 'annee_bac',
  'langues', 'parcours_academique', 'niveau_actuel', 'photo_profil',
];

// Référence métier (alignée avec Candidat.NATIONALITE_TUNISIENNE)
const NATIONALITE_TUNISIENNE = 'tunisienne';

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

// Vérifie la complétude du profil Candidat avant soumission d'une candidature.
// Liste exhaustive des champs requis :
//   prenom, nom, telephone, nationalite, adresse.ville, parcours_academique (≥1)
//   + cin (si tunisien) OU numero_passeport (sinon)
// Retourne { complet, manquants: string[] } — manquants utilise des chemins
// de notation pointée pour les champs imbriqués (ex: 'adresse.ville').
function verifierProfilComplet(candidat) {
  if (!candidat) return { complet: false, manquants: ['profil_introuvable'] };

  const manquants = [];

  if (!candidat.prenom) manquants.push('prenom');
  if (!candidat.nom) manquants.push('nom');
  if (!candidat.telephone) manquants.push('telephone');
  if (!candidat.nationalite) manquants.push('nationalite');

  // Identité légale conditionnelle (cohérente avec le hook beforeValidate du modèle)
  const estTunisien =
    candidat.nationalite?.toLowerCase().trim() === NATIONALITE_TUNISIENNE;
  if (estTunisien) {
    if (!candidat.cin) manquants.push('cin');
  } else if (candidat.nationalite) {
    if (!candidat.numero_passeport) manquants.push('numero_passeport');
  }

  // Adresse : seule la ville est strictement requise au MVP
  if (!candidat.adresse || !candidat.adresse.ville) manquants.push('adresse.ville');

  // Au moins une entrée de parcours académique
  if (!Array.isArray(candidat.parcours_academique) || candidat.parcours_academique.length === 0) {
    manquants.push('parcours_academique');
  }

  return { complet: manquants.length === 0, manquants };
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

// Soumet le brouillon. Pipeline en 3 étapes (toutes dans la même transaction) :
//   1. Si `profil` fourni, met à jour le Candidat (whitelist + hook identité)
//   2. Vérifie la complétude du profil (verifierProfilComplet)
//   3. Vérifie la complétude documentaire (verifierCompletude)
// Puis bascule statut → 'soumise' et déclenche les notifications.
//
// Source de vérité : Candidat. Aucune duplication d'identité dans Candidature.
exports.soumettre = async ({ candidature_id, user_id, profil }) => {
  const candidature = await Candidature.findByPk(candidature_id);
  if (!candidature) throw { status: 404, message: 'Candidature introuvable.' };

  validerTransition('candidat', candidature.statut, 'soumise');

  const ancien_statut = candidature.statut;

  return sequelize.transaction(async (t) => {
    // ── 1. Auto-update du profil Candidat (avant validation) ──
    const candidat = await Candidat.findByPk(candidature.candidat_id, { transaction: t });
    if (!candidat) throw { status: 404, message: 'Profil candidat introuvable.' };

    if (profil && typeof profil === 'object') {
      // Whitelist stricte : ignore silencieusement les champs hors liste
      const maj = {};
      for (const champ of CHAMPS_PROFIL_AUTORISES) {
        if (profil[champ] !== undefined) maj[champ] = profil[champ];
      }
      if (Object.keys(maj).length > 0) {
        try {
          await candidat.update(maj, { transaction: t });
        } catch (err) {
          // Le hook beforeValidate jette des Error ("CIN obligatoire…") :
          // on les normalise au format API (status 400) sans masquer le message.
          if (err.status) throw err;
          throw { status: 400, message: err.message || 'Profil invalide.' };
        }
        await candidat.reload({ transaction: t });
      }
    }

    // ── 2. Vérifier la complétude du profil ──
    const profilCheck = verifierProfilComplet(candidat);
    if (!profilCheck.complet) {
      throw {
        status: 400,
        message: 'Veuillez compléter votre profil avant de soumettre la candidature.',
        manquants_profil: profilCheck.manquants,
      };
    }

    // ── 3. Vérifier la complétude documentaire ──
    const docCheck = await verifierCompletude(candidature);
    if (!docCheck.complet) {
      throw {
        status: 400,
        message: `Documents obligatoires manquants : ${docCheck.details.map((d) => d.label).join(', ')}.`,
        manquants: docCheck.manquants,
        details: docCheck.details,
      };
    }

    // ── 4. Vérification authenticité diplôme (non-bloquante) ──────────────
    const docDiplome = (candidature.documents_soumis ?? []).find(
      (d) => d && d.nom && NOMS_DIPLOMES.includes(d.nom)
    );

    if (docDiplome && docDiplome.url) {
      const cheminFichier = path.resolve(
        __dirname,
        '../../uploads',
        path.basename(docDiplome.url)
      );

      const resultatVerif = await verifierDiplome(cheminFichier, docDiplome.nom);

      if (resultatVerif.succes && resultatVerif.score !== null) {
        const scoreTag = `[DiplomaVerifier] score=${resultatVerif.score}/100, niveau=${resultatVerif.niveau}`;
        const notesExistantes = candidature.notes_institut ?? '';
        candidature.notes_institut = notesExistantes
          ? `${notesExistantes}\n${scoreTag}`
          : scoreTag;
        candidature.changed('notes_institut', true);

        if (resultatVerif.score < 50) {
          console.warn(
            '[candidatureWorkflow] Score diplôme faible pour candidature %s : %d/100 — raisons : %s',
            candidature.id,
            resultatVerif.score,
            (resultatVerif.raisons ?? []).join(', ')
          );
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // ── 5. Bascule de statut + notifications ──
    await candidature.update({
      statut: 'soumise',
      soumise_le: new Date(),
      notes_institut: candidature.notes_institut,
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
exports.CHAMPS_PROFIL_AUTORISES = CHAMPS_PROFIL_AUTORISES;
exports.validerTransition = validerTransition;
exports.verifierCompletude = verifierCompletude;
exports.verifierProfilComplet = verifierProfilComplet;
exports.verifierDoublon = verifierDoublon;
