// controllers/historiqueController.js
const { Historique } = require('../models');

// GET /api/historiques  (admin)
exports.getAll = async (_req, res) => {
  try {
    const historiques = await Historique.findAll({ order: [['createdAt', 'DESC']] });
    return res.status(200).json({ historiques });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
