// controllers/programController.js
const { Op } = require('sequelize');
const { Program, Institute } = require('../models');

// GET /api/programs  – public avec filtres
exports.getAll = async (req, res) => {
  try {
    const { level, field_of_study, instituteId, language, accreditation_status } = req.query;
    const where = {};
    if (level)                where.level                = level;
    if (field_of_study)       where.field_of_study       = { [Op.iLike]: `%${field_of_study}%` };
    if (instituteId)          where.instituteId          = instituteId;
    if (language)             where.language             = language;
    if (accreditation_status) where.accreditation_status = accreditation_status;

    const programs = await Program.findAll({
      where,
      include: [{ model: Institute, as: 'institute', attributes: ['id', 'name', 'short_name', 'city'] }],
    });
    return res.status(200).json({ programs });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// GET /api/programs/:id  – public
exports.getOne = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id, {
      include: [{ model: Institute, as: 'institute' }],
    });
    if (!program) return res.status(404).json({ message: 'Programme introuvable.' });
    return res.status(200).json({ program });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// POST /api/programs  (admin ou institute)
exports.create = async (req, res) => {
  try {
    const {
      name, description, type, level, field_of_study, duration_years,
      language, tuition_fee_tnd, capacity, start_date, requirements,
      credits_ects, accreditation_valid_until, accreditation_status, instituteId,
    } = req.body;

    if (!name || !instituteId) {
      return res.status(400).json({ message: 'Nom et instituteId requis.' });
    }

    // Un utilisateur institute ne peut créer que dans son propre établissement
    if (req.user.role === 'institute' && req.user.instituteId !== instituteId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const program = await Program.create({
      name, description, type, level, field_of_study, duration_years,
      language, tuition_fee_tnd, capacity, start_date, requirements,
      credits_ects, accreditation_valid_until, accreditation_status,
      instituteId,
    });

    return res.status(201).json({ message: 'Programme créé.', program });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// PUT /api/programs/:id  (admin ou institute)
exports.update = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ message: 'Programme introuvable.' });

    if (req.user.role === 'institute' && req.user.instituteId !== program.instituteId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await program.update(req.body);
    return res.status(200).json({ message: 'Programme mis à jour.', program });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// DELETE /api/programs/:id  (admin ou institute)
exports.remove = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ message: 'Programme introuvable.' });

    if (req.user.role === 'institute' && req.user.instituteId !== program.instituteId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await program.destroy();
    return res.status(200).json({ message: 'Programme supprimé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
