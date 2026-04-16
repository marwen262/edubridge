// controllers/instituteController.js
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Institute, User, Program, Country } = require('../models');

// GET /api/institutes  – public
exports.getAll = async (req, res) => {
  try {
    const { governorate, type, city } = req.query;
    const where = {};
    if (governorate) where.governorate = governorate;
    if (type)        where.type        = type;
    if (city)        where.city        = { [Op.iLike]: `%${city}%` };

    const institutes = await Institute.findAll({
      where,
      include: [
        { model: Program, as: 'programs', attributes: ['id', 'name', 'level', 'accreditation_status'] },
        { model: Country, as: 'country', attributes: ['id', 'name'] },
      ],
    });
    return res.status(200).json({ institutes });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// GET /api/institutes/:id  – public
exports.getOne = async (req, res) => {
  try {
    const institute = await Institute.findByPk(req.params.id, {
      include: [
        { model: Program, as: 'programs' },
        { model: Country, as: 'country' },
      ],
    });
    if (!institute) return res.status(404).json({ message: 'Établissement introuvable.' });
    return res.status(200).json({ institute });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// POST /api/institutes  (admin)
// Crée l'Institut ET un User de rôle 'institute' associé
exports.create = async (req, res) => {
  try {
    const {
      name, short_name, name_ar, email, type,
      phone, address, city, governorate, postal_code,
      founded_year, accreditation, ranking, website, facebook_url,
      definition, description, notes, localisation, countryId,
      // Mot de passe pour l'utilisateur institute
      password,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Nom et email requis.' });
    }

    // Vérifie doublon email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email déjà utilisé.' });
    }

    const logo = req.file ? `uploads/${req.file.filename}` : null;

    // Crée d'abord un User placeholder (le vrai userId sera mis à jour après)
    const plainPassword = password || Math.random().toString(36).slice(-8) + 'A1!';
    const hashed = await bcrypt.hash(plainPassword, 10);

    const user = await User.create({
      email,
      password: hashed,
      role: 'institute',
      firstName: name,
    });

    const institute = await Institute.create({
      name, short_name, name_ar, email, type: type || 'private',
      logo, phone, address, city, governorate, postal_code,
      founded_year, accreditation, ranking, website, facebook_url,
      definition, description, notes, localisation,
      countryId: countryId || 1,
      userId: user.id,
    });

    // Lie l'User à l'Institut
    await user.update({ instituteId: institute.id });

    return res.status(201).json({ message: 'Établissement créé.', institute, userId: user.id });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// PUT /api/institutes/:id  (admin ou institute propriétaire)
exports.update = async (req, res) => {
  try {
    const institute = await Institute.findByPk(req.params.id);
    if (!institute) return res.status(404).json({ message: 'Établissement introuvable.' });

    // Un utilisateur institute ne peut modifier que son propre établissement
    if (req.user.role === 'institute' && req.user.instituteId !== req.params.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const logo = req.file ? `uploads/${req.file.filename}` : institute.logo;
    const data  = { ...req.body, logo };
    // Ne pas changer userId via cet endpoint
    delete data.userId;

    await institute.update(data);
    return res.status(200).json({ message: 'Établissement mis à jour.', institute });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

// DELETE /api/institutes/:id  (admin)
exports.remove = async (req, res) => {
  try {
    const institute = await Institute.findByPk(req.params.id);
    if (!institute) return res.status(404).json({ message: 'Établissement introuvable.' });
    await institute.destroy();
    return res.status(200).json({ message: 'Établissement supprimé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
