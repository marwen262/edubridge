// middleware/authMiddleware.js — vérifie le JWT et résout le profil lié (candidat ou institut)
const jwt = require('jsonwebtoken');
const { Utilisateur, Institut, Candidat } = require('../models');

// Injecte req.user = { id, role, institut_id?, candidat_id? }
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant ou mal formaté.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const utilisateur = await Utilisateur.findByPk(decoded.id, {
      attributes: ['id', 'role', 'est_actif'],
    });
    if (!utilisateur) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }
    if (!utilisateur.est_actif) {
      return res.status(403).json({ message: 'Compte désactivé.' });
    }

    const user = {
      id: utilisateur.id,
      role: utilisateur.role,
      institut_id: null,
      candidat_id: null,
    };

    // Résolution du profil selon le rôle (requête ciblée)
    if (utilisateur.role === 'institut') {
      const institut = await Institut.findOne({
        where: { utilisateur_id: utilisateur.id },
        attributes: ['id'],
      });
      user.institut_id = institut ? institut.id : null;
    } else if (utilisateur.role === 'candidat') {
      const candidat = await Candidat.findOne({
        where: { utilisateur_id: utilisateur.id },
        attributes: ['id'],
      });
      user.candidat_id = candidat ? candidat.id : null;
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.', error: err.message });
  }
};

// Garde-fou admin — à utiliser APRÈS authMiddleware
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
  }
  next();
};

// restrictTo(...roles) — autorise uniquement les rôles fournis
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      message: `Accès interdit. Rôles autorisés : ${roles.join(', ')}.`,
    });
  }
  next();
};

module.exports = authMiddleware;
module.exports.isAdmin = isAdmin;
module.exports.restrictTo = restrictTo;
