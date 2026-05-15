// controllers/candidatureController.js — Endpoints candidatures (couche mince → services/candidatureWorkflow)
const { Op } = require('sequelize');
const { Candidature, Candidat, Programme, Institut } = require('../models');
const workflow = require('../services/candidatureWorkflow');
const { lirePagination, construirePaginationMeta } = require('../utils/pagination');

// POST /api/candidatures — Crée un brouillon (candidat)
exports.creerCandidature = async (req, res) => {
  try {
    if (!req.user.candidat_id) {
      return res.status(403).json({ message: 'Profil candidat introuvable.' });
    }
    const { programme_id, lettre_motivation } = req.body;
    if (!programme_id) return res.status(400).json({ message: 'programme_id requis.' });

    const candidature = await workflow.creerBrouillon({
      candidat_id: req.user.candidat_id,
      programme_id,
      lettre_motivation,
      files: req.files,
      user_id: req.user.id,
    });

    return res.status(201).json({ message: 'Brouillon créé.', candidature });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message, manquants: error.manquants });
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/candidatures/:id — Modifie un brouillon (candidat, statut=brouillon uniquement)
exports.mettreAJourCandidature = async (req, res) => {
  try {
    if (!req.user.candidat_id) {
      return res.status(403).json({ message: 'Profil candidat introuvable.' });
    }
    const candidature = await workflow.mettreAJourBrouillon({
      candidature_id: req.params.id,
      lettre_motivation: req.body.lettre_motivation,
      files: req.files,
      user_id: req.user.id,
    });
    return res.status(200).json({ message: 'Brouillon mis à jour.', candidature });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/candidatures/:id/soumettre — Soumet le brouillon (candidat)
// Le frontend envoie aussi les champs de profil dans req.body.profil — ils sont
// appliqués au Candidat AVANT la validation de complétude (auto-update).
exports.soumettreCandidature = async (req, res) => {
  try {
    if (!req.user.candidat_id) {
      return res.status(403).json({ message: 'Profil candidat introuvable.' });
    }
    const candidature = await workflow.soumettre({
      candidature_id: req.params.id,
      user_id: req.user.id,
      profil: req.body?.profil,
    });
    return res.status(200).json({ message: 'Candidature soumise avec succès.', candidature });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
        manquants: error.manquants,
        manquants_profil: error.manquants_profil,
      });
    }
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PATCH /api/candidatures/:id/statut — Transition de statut (institut ou admin)
exports.changerStatut = async (req, res) => {
  try {
    const { statut, notes_institut } = req.body;
    if (!statut) return res.status(400).json({ message: 'statut requis.' });

    const candidature = await workflow.changerStatut({
      candidature_id: req.params.id,
      statut_cible: statut,
      user_id: req.user.id,
      role: req.user.role,
      notes_institut,
      institut_id: req.user.institut_id,
    });
    return res.status(200).json({ message: 'Statut mis à jour.', candidature });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/candidatures/mine — Mes candidatures (candidat connecté)
exports.getMesCandidatures = async (req, res) => {
  try {
    if (!req.user.candidat_id) {
      return res.status(403).json({ message: 'Profil candidat introuvable.' });
    }
    const candidatures = await Candidature.findAll({
      where: { candidat_id: req.user.candidat_id },
      include: [{
        model: Programme, as: 'programme',
        include: [{ model: Institut, as: 'institut', attributes: ['id', 'nom', 'sigle'] }],
      }],
      order: [['cree_le', 'DESC']],
    });
    return res.status(200).json({ candidatures });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/candidatures/institute/list — Candidatures reçues par l'institut connecté
// On inclut les champs d'identité du Candidat pour permettre à l'institut de
// décider sans appel API supplémentaire (cf. Phase D du refactor candidature).
exports.getCandidaturesInstitut = async (req, res) => {
  try {
    if (!req.user.institut_id) {
      return res.status(403).json({ message: 'Profil institut introuvable.' });
    }
    const candidatures = await Candidature.findAll({
      where: { statut: { [Op.ne]: 'brouillon' } },
      include: [
        {
          model: Programme, as: 'programme',
          where: { institut_id: req.user.institut_id },
          attributes: ['id', 'titre'],
        },
        {
          model: Candidat, as: 'candidat',
          attributes: [
            'id', 'prenom', 'nom', 'date_naissance', 'genre',
            'telephone', 'adresse', 'nationalite',
            'cin', 'numero_passeport', 'type_piece_identite',
            'niveau_actuel', 'type_bac', 'moyenne_bac', 'annee_bac',
            'parcours_academique',
          ],
        },
      ],
      order: [['cree_le', 'DESC']],
    });
    return res.status(200).json({ candidatures });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/candidatures — Toutes les candidatures (admin) + pagination
exports.getAllCandidatures = async (req, res) => {
  try {
    const { statut, programme_id } = req.query;
    const where = {};
    if (statut) where.statut = statut;
    if (programme_id) where.programme_id = programme_id;

    const { page, limit, offset } = lirePagination(req.query);

    // distinct: true pour ne pas sur-compter à cause des includes Candidat/Programme
    const { rows: candidatures, count: total } = await Candidature.findAndCountAll({
      where,
      include: [
        { model: Candidat,  as: 'candidat',  attributes: ['id', 'prenom', 'nom'] },
        { model: Programme, as: 'programme', attributes: ['id', 'titre', 'domaine', 'niveau', 'institut_id'],
          include: [{ model: Institut, as: 'institut', attributes: ['id', 'nom', 'sigle'] }] },
      ],
      order: [['cree_le', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      candidatures,
      pagination: construirePaginationMeta({ total, page, limit }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/candidatures/:id — Détail d'une candidature
exports.getCandidatureById = async (req, res) => {
  try {
    const candidature = await Candidature.findByPk(req.params.id, {
      include: [
        { model: Candidat,  as: 'candidat' },
        { model: Programme, as: 'programme', include: [{ model: Institut, as: 'institut' }] },
      ],
    });
    if (!candidature) return res.status(404).json({ message: 'Ressource introuvable.' });

    // Contrôle d'accès selon le rôle — on renvoie 404 (pas 403) pour les
    // non-admins afin d'éviter de révéler l'existence de la ressource.
    const { role, candidat_id, institut_id } = req.user;
    if (role === 'candidat' && candidature.candidat_id !== candidat_id) {
      return res.status(404).json({ message: 'Ressource introuvable.' });
    }
    if (role === 'institut' && candidature.programme?.institut_id !== institut_id) {
      return res.status(404).json({ message: 'Ressource introuvable.' });
    }

    return res.status(200).json({ candidature });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/candidatures/:id — Suppression
// Admin : toute candidature. Candidat : uniquement ses propres brouillons.
exports.deleteCandidature = async (req, res) => {
  try {
    const candidature = await Candidature.findByPk(req.params.id);
    if (!candidature) return res.status(404).json({ message: 'Ressource introuvable.' });

    const { role, candidat_id } = req.user;
    if (role === 'candidat') {
      if (candidature.candidat_id !== candidat_id) {
        return res.status(404).json({ message: 'Ressource introuvable.' });
      }
      if (candidature.statut !== 'brouillon') {
        return res.status(409).json({
          message: 'Seuls les brouillons peuvent être supprimés.',
        });
      }
    } else if (role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await candidature.destroy();
    return res.status(200).json({ message: 'Candidature supprimée.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
