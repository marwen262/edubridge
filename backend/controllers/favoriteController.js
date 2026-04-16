// controllers/favoriteController.js
const { Favorite, Program, Institute } = require('../models');

// POST /api/favorites  (candidate) – toggle
exports.toggle = async (req, res) => {
  try {
    const { programId } = req.body;
    if (!programId) return res.status(400).json({ message: 'programId requis.' });

    const existing = await Favorite.findOne({ where: { userId: req.user.id, programId } });
    if (existing) {
      await existing.destroy();
      return res.status(200).json({ message: 'Retiré des favoris.' });
    }

    const fav = await Favorite.create({ userId: req.user.id, programId });
    return res.status(201).json({ message: 'Ajouté aux favoris.', favorite: fav });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// DELETE /api/favorites/:id  (candidate)
exports.remove = async (req, res) => {
  try {
    const fav = await Favorite.findByPk(req.params.id);
    if (!fav) return res.status(404).json({ message: 'Favori introuvable.' });
    if (fav.userId !== req.user.id) return res.status(403).json({ message: 'Accès refusé.' });
    await fav.destroy();
    return res.status(200).json({ message: 'Favori supprimé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// GET /api/favorites/mine  (candidate)
exports.getMine = async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Program, as: 'program',
          include: [{ model: Institute, as: 'institute', attributes: ['id','name','city'] }],
        },
      ],
    });
    return res.status(200).json({ favorites });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
