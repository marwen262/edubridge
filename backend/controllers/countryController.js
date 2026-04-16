// controllers/countryController.js
const { Country } = require('../models');

// GET /api/countries  – public
exports.getAll = async (_req, res) => {
  try {
    const countries = await Country.findAll({ order: [['name', 'ASC']] });
    return res.status(200).json({ countries });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
