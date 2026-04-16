// controllers/applicationController.js
const { Application, Program, Institute, Historique } = require('../models');

// ── Helpers ────────────────────────────────────────────────────────────

/** Enregistre une entrée dans Historiques */
const logHistorique = async (action, type, description) => {
  await Historique.create({ action, type, description });
};

/** Valide les champs obligatoires d'une candidature */
const validateApplicationBody = (body) => {
  const required = [
    'annee_universitaire','niveau_demande','mode_etudes',
    'firstName','lastName','sex','date_naissance','lieu_naissance',
    'situation_familiale','nationalite','email','telephone',
    'piece_identite_type','piece_identite_numero',
    'adresse_pays_id','adresse_ville','adresse_rue',
    'bac_pays_id','bac_annee','bac_section',
    'programId',
  ];
  const missing = required.filter((f) => !body[f]);
  return missing;
};

// ── Endpoints ──────────────────────────────────────────────────────────

// POST /api/applications  (candidate)
exports.create = async (req, res) => {
  try {
    const body = req.body;

    // Vérifie consentement
    if (body.consent_accepted !== 'true' && body.consent_accepted !== true) {
      return res.status(400).json({ message: 'Vous devez accepter les conditions.' });
    }

    // Valide champs obligatoires
    const missing = validateApplicationBody(body);
    if (missing.length > 0) {
      return res.status(400).json({ message: 'Champs manquants.', missing });
    }

    // Valide bac_annee
    const currentYear = new Date().getFullYear();
    if (body.bac_annee < 1950 || body.bac_annee > currentYear) {
      return res.status(400).json({ message: 'Année bac invalide.' });
    }

    // Valide last_study_annee si fourni
    if (body.last_study_annee && (body.last_study_annee < 1950 || body.last_study_annee > currentYear)) {
      return res.status(400).json({ message: 'Année dernière étude invalide.' });
    }

    // Valide governorat si pays = Tunisie (id=1)
    if (parseInt(body.adresse_pays_id) === 1 && !body.adresse_gouvernorat) {
      return res.status(400).json({ message: 'Gouvernorat requis pour une adresse en Tunisie.' });
    }

    // Récupère l'instituteId depuis le programme
    const program = await Program.findByPk(body.programId);
    if (!program) return res.status(404).json({ message: 'Programme introuvable.' });

    // Chemins fichiers uploadés
    const files = req.files || {};
    const diplomaFileUrl        = files.diplomaFile?.[0]        ? `uploads/${files.diplomaFile[0].filename}`        : null;
    const pieceIdentiteFileUrl  = files.pieceIdentiteFile?.[0]  ? `uploads/${files.pieceIdentiteFile[0].filename}`  : null;
    const photoFileUrl          = files.photoFile?.[0]          ? `uploads/${files.photoFile[0].filename}`          : null;

    const application = await Application.create({
      ...body,
      userId:                req.user.id,
      instituteId:           program.instituteId,
      status:                'pending_admin',
      consent_accepted:      true,
      diplomaFileUrl,
      pieceIdentiteFileUrl,
      photoFileUrl,
    });

    await logHistorique(
      'Création candidature',
      'candidature',
      `Candidature ${application.id} créée par l'utilisateur ${req.user.id} pour le programme ${body.programId}`
    );

    return res.status(201).json({ message: 'Candidature soumise.', application });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// GET /api/applications/mine  (candidate)
exports.getMine = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Program,   as: 'program',   include: [{ model: Institute, as: 'institute', attributes: ['id','name','city'] }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json({ applications });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// GET /api/applications  (admin)
exports.getAll = async (req, res) => {
  try {
    const { status, programId, instituteId } = req.query;
    const where = {};
    if (status)      where.status      = status;
    if (programId)   where.programId   = programId;
    if (instituteId) where.instituteId = instituteId;

    const applications = await Application.findAll({
      where,
      include: [
        { model: Program,   as: 'program' },
        { model: Institute, as: 'institute', attributes: ['id','name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json({ applications });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// GET /api/applications/institute/list  (institute)
exports.getForInstitute = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { instituteId: req.user.instituteId },
      include: [{ model: Program, as: 'program', attributes: ['id','name','level'] }],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json({ applications });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// GET /api/applications/:id
exports.getOne = async (req, res) => {
  try {
    const app = await Application.findByPk(req.params.id, {
      include: [
        { model: Program,   as: 'program' },
        { model: Institute, as: 'institute' },
      ],
    });
    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    // Vérification droits d'accès
    const { role, id, instituteId } = req.user;
    if (role === 'candidate'  && app.userId      !== id)          return res.status(403).json({ message: 'Accès refusé.' });
    if (role === 'institute'  && app.instituteId !== instituteId) return res.status(403).json({ message: 'Accès refusé.' });

    return res.status(200).json({ application: app });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// PUT /api/applications/:id/assign  (admin)
exports.assign = async (req, res) => {
  try {
    const { instituteId } = req.body;
    if (!instituteId) return res.status(400).json({ message: 'instituteId requis.' });

    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    await app.update({ instituteId, status: 'sent_to_institute' });
    await logHistorique('Assignation candidature', 'candidature', `Candidature ${app.id} assignée à l'établissement ${instituteId}`);

    return res.status(200).json({ message: 'Candidature assignée.', application: app });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// PUT /api/applications/:id/institute-decision  (institute)
exports.instituteDecision = async (req, res) => {
  try {
    const { decision, notes } = req.body;
    const allowed = ['pre_accepted', 'pre_rejected'];
    if (!allowed.includes(decision)) {
      return res.status(400).json({ message: 'Décision invalide. Valeurs : pre_accepted, pre_rejected.' });
    }

    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    if (app.instituteId !== req.user.instituteId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await app.update({ status: decision, notes });
    await logHistorique('Décision établissement', 'candidature', `Candidature ${app.id} → ${decision}`);

    return res.status(200).json({ message: 'Décision enregistrée.', application: app });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// PUT /api/applications/:id/final-decision  (admin)
exports.finalDecision = async (req, res) => {
  try {
    const { decision, notes } = req.body;
    const allowed = ['accepted', 'rejected'];
    if (!allowed.includes(decision)) {
      return res.status(400).json({ message: 'Décision invalide. Valeurs : accepted, rejected.' });
    }

    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });

    await app.update({ status: decision, notes });
    await logHistorique('Décision finale admin', 'candidature', `Candidature ${app.id} → ${decision}`);

    return res.status(200).json({ message: 'Décision finale enregistrée.', application: app });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// DELETE /api/applications/:id  (admin)
exports.remove = async (req, res) => {
  try {
    const app = await Application.findByPk(req.params.id);
    if (!app) return res.status(404).json({ message: 'Candidature introuvable.' });
    await app.destroy();
    return res.status(200).json({ message: 'Candidature supprimée.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
