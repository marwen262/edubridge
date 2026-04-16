// middleware/authMiddleware.js
const jwt  = require('jsonwebtoken');
const { User } = require('../models');

/**
 * authMiddleware – vérifie le token JWT dans l'en-tête Authorization
 * Injecte req.user = { id, role, instituteId }
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant ou mal formaté.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifie que l'utilisateur existe toujours en base
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'instituteId'],
    });
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    req.user = {
      id:          user.id,
      role:        user.role,
      instituteId: user.instituteId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.', error: err.message });
  }
};

/**
 * isAdmin – middleware qui s'utilise APRÈS authMiddleware
 */
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
};

/**
 * restrictTo(...roles) – autorise uniquement les rôles spécifiés
 * Usage : restrictTo('admin', 'institute')
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      message: `Accès interdit. Rôles autorisés : ${roles.join(', ')}.`,
    });
  }
  next();
};

module.exports = authMiddleware;
module.exports.isAdmin    = isAdmin;
module.exports.restrictTo = restrictTo;
