// controllers/programmeController.js — CRUD des programmes (formations) d'un institut
const { Op } = require('sequelize');
const { Programme, Institut } = require('../models');
const { lirePagination, construirePaginationMeta } = require('../utils/pagination');

// Champs éditables par un admin ou par l'institut propriétaire
const CHAMPS_EDITABLES = [
  'titre', 'domaine', 'niveau', 'mode', 'duree_annees',
  'description', 'documents_requis', 'prerequis',
  'frais_inscription', 'date_limite_candidature',
  'capacite', 'est_actif',
];

function pick(body, keys) {
  const out = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

// GET /api/programmes — public, filtres par ENUMs et recherche texte + pagination
exports.getAllProgrammes = async (req, res) => {
  try {
    const { domaine, niveau, mode, institut_id, est_actif, titre } = req.query;
    const where = {};
    if (domaine)     where.domaine     = domaine;
    if (niveau)      where.niveau      = niveau;
    if (mode)        where.mode        = mode;
    if (institut_id) where.institut_id = institut_id;
    // Par défaut on n'expose que les programmes actifs ; l'institut peut passer
    // est_actif=false ou est_actif=all pour voir ses brouillons.
    if (est_actif === 'all') { /* pas de filtre */ }
    else if (est_actif !== undefined) where.est_actif = est_actif === 'true';
    else where.est_actif = true;
    if (titre)       where.titre       = { [Op.iLike]: `%${titre}%` };

    const { page, limit, offset } = lirePagination(req.query);

    // findAndCountAll : count distinct sur Programme.id pour éviter le sur-comptage
    // induit par les jointures (include Institut).
    const { rows: programmes, count: total } = await Programme.findAndCountAll({
      where,
      include: [
        { model: Institut, as: 'institut', attributes: ['id', 'nom', 'sigle'] },
      ],
      order: [['cree_le', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      programmes,
      pagination: construirePaginationMeta({ total, page, limit }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/programmes/:id — public
exports.getProgrammeById = async (req, res) => {
  try {
    const programme = await Programme.findByPk(req.params.id, {
      include: [{ model: Institut, as: 'institut' }],
    });
    if (!programme) return res.status(404).json({ message: 'Ressource introuvable.' });
    return res.status(200).json({ programme });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/programmes — admin ou institut (pour son propre établissement)
exports.createProgramme = async (req, res) => {
  try {
    const { titre } = req.body;
    let { institut_id } = req.body;

    // Si rôle institut → assigne automatiquement institut_id
    if (req.user.role === 'institut') {
      institut_id = req.user.institut_id;
    }

    if (!titre || !institut_id) {
      return res.status(400).json({ message: 'Champs requis : titre, institut_id.' });
    }

    // Un institut ne peut créer que dans son propre établissement
    if (req.user.role === 'institut' && req.user.institut_id !== institut_id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const programme = await Programme.create({
      institut_id,
      ...pick(req.body, CHAMPS_EDITABLES),
    });
    return res.status(201).json({ message: 'Programme créé.', programme });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/programmes/:id — admin ou institut propriétaire
exports.updateProgramme = async (req, res) => {
  try {
    const programme = await Programme.findByPk(req.params.id);
    if (!programme) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (req.user.role === 'institut' && req.user.institut_id !== programme.institut_id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await programme.update(pick(req.body, CHAMPS_EDITABLES));
    return res.status(200).json({ message: 'Programme mis à jour.', programme });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/programmes/:id — admin ou institut propriétaire
exports.deleteProgramme = async (req, res) => {
  try {
    const programme = await Programme.findByPk(req.params.id);
    if (!programme) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (req.user.role === 'institut' && req.user.institut_id !== programme.institut_id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await programme.destroy();
    return res.status(200).json({ message: 'Programme supprimé.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
