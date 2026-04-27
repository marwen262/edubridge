// controllers/institutController.js — CRUD des instituts
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, Institut, Utilisateur, Programme } = require('../models');

const CHAMPS_EDITABLES = [
  'nom', 'sigle', 'description', 'site_web', 'logo',
  'adresse', 'accreditations', 'contact', 'note',
];

function pick(body, keys) {
  const out = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

// GET /api/instituts — public (filtres: nom, est_verifie)
exports.getAllInstituts = async (req, res) => {
  try {
    const { nom, est_verifie } = req.query;
    const where = {};
    if (nom) where.nom = { [Op.iLike]: `%${nom}%` };
    if (est_verifie !== undefined) where.est_verifie = est_verifie === 'true';

    const instituts = await Institut.findAll({
      where,
      include: [
        { model: Programme, as: 'programmes', attributes: ['id', 'titre', 'domaine', 'niveau', 'est_actif'] },
      ],
      order: [['nom', 'ASC']],
    });
    return res.status(200).json({ instituts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/instituts/:id — public
exports.getInstitutById = async (req, res) => {
  try {
    const institut = await Institut.findByPk(req.params.id, {
      include: [{ model: Programme, as: 'programmes' }],
    });
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });
    return res.status(200).json({ institut });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/instituts — admin : crée Utilisateur role=institut + Institut
exports.createInstitut = async (req, res) => {
  try {
    const { email, password, nom } = req.body;
    if (!email || !nom) {
      return res.status(400).json({ message: 'Champs requis : email, nom.' });
    }

    const existing = await Utilisateur.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Conflit : ressource déjà existante.' });
    }

    const plainPassword = password || Math.random().toString(36).slice(-8) + 'A1!';
    const hashed = await bcrypt.hash(plainPassword, 10);

    const result = await sequelize.transaction(async (t) => {
      const utilisateur = await Utilisateur.create({
        email,
        mot_de_passe: hashed,
        role: 'institut',
      }, { transaction: t });

      const institut = await Institut.create({
        utilisateur_id: utilisateur.id,
        ...pick(req.body, CHAMPS_EDITABLES),
      }, { transaction: t });

      return { utilisateur, institut };
    });

    return res.status(201).json({
      message: 'Établissement créé.',
      institut: result.institut,
      utilisateur_id: result.utilisateur.id,
      mot_de_passe_initial: password ? undefined : plainPassword,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/instituts/:id — admin ou institut propriétaire
exports.updateInstitut = async (req, res) => {
  try {
    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (req.user.role === 'institut' && req.user.institut_id !== req.params.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const updates = pick(req.body, CHAMPS_EDITABLES);
    if (req.user.role === 'admin' && req.body.est_verifie !== undefined) {
      updates.est_verifie = req.body.est_verifie;
    }

    await institut.update(updates);
    return res.status(200).json({ message: 'Établissement mis à jour.', institut });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/instituts/:id — admin
exports.deleteInstitut = async (req, res) => {
  try {
    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });
    await Utilisateur.destroy({ where: { id: institut.utilisateur_id } });
    return res.status(200).json({ message: 'Établissement supprimé.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
