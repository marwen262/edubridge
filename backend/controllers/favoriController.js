// controllers/favoriController.js — gestion des favoris Candidat ↔ Programme
const { Favori, Programme, Institut } = require('../models');

// GET /api/favoris/mine — liste les favoris du candidat connecté
exports.getMesFavoris = async (req, res) => {
  try {
    if (!req.user.candidat_id) {
      return res.status(403).json({ message: 'Profil candidat introuvable.' });
    }
    const favoris = await Favori.findAll({
      where: { candidat_id: req.user.candidat_id },
      include: [{
        model: Programme, as: 'programme',
        include: [{ model: Institut, as: 'institut', attributes: ['id', 'nom', 'sigle'] }],
      }],
      order: [['cree_le', 'DESC']],
    });
    return res.status(200).json({ favoris });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/favoris — toggle (crée ou supprime le favori)
exports.toggleFavori = async (req, res) => {
  try {
    if (!req.user.candidat_id) {
      return res.status(403).json({ message: 'Profil candidat introuvable.' });
    }
    const { programme_id } = req.body;
    if (!programme_id) return res.status(400).json({ message: 'programme_id requis.' });

    const existing = await Favori.findOne({
      where: { candidat_id: req.user.candidat_id, programme_id },
    });
    if (existing) {
      await existing.destroy();
      return res.status(200).json({ message: 'Retiré des favoris.' });
    }

    const favori = await Favori.create({
      candidat_id: req.user.candidat_id,
      programme_id,
    });
    return res.status(201).json({ message: 'Ajouté aux favoris.', favori });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/favoris/:programme_id
exports.deleteFavori = async (req, res) => {
  try {
    if (!req.user.candidat_id) {
      return res.status(403).json({ message: 'Profil candidat introuvable.' });
    }
    const favori = await Favori.findOne({
      where: {
        candidat_id: req.user.candidat_id,
        programme_id: req.params.programme_id,
      },
    });
    if (!favori) return res.status(404).json({ message: 'Ressource introuvable.' });
    await favori.destroy();
    return res.status(200).json({ message: 'Favori supprimé.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
