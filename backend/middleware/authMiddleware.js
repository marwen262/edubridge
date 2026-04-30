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
      attributes: ['id', 'role', 'est_actif', 'first_login_completed'],
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

    if (utilisateur.role === 'institut') {
      const institut = await Institut.findOne({
        where: { utilisateur_id: utilisateur.id },
        attributes: ['id', 'validation_status', 'suspension_reason'],
      });

      if (institut) {
        // Bloquer l'accès aux instituts suspendus sur toutes les routes protégées
        if (institut.validation_status === 'suspended') {
          return res.status(403).json({
            message: 'Votre compte a été suspendu par l\'administration.',
            code: 'ACCOUNT_SUSPENDED',
            reason: institut.suspension_reason || null,
          });
        }
        user.institut_id = institut.id;
      }
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

// optionalAuth — populate req.user if a valid token is present, continue silently otherwise.
// Used on public routes that need role-awareness (ex: GET /api/instituts avec admin_view).
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const utilisateur = await Utilisateur.findByPk(decoded.id, {
      attributes: ['id', 'role', 'est_actif'],
    });
    if (utilisateur && utilisateur.est_actif) {
      req.user = { id: utilisateur.id, role: utilisateur.role };
    }
  } catch {
    // token invalide ou expiré → on continue comme visiteur anonyme
  }
  next();
};

module.exports = authMiddleware;
module.exports.isAdmin = isAdmin;
module.exports.restrictTo = restrictTo;
module.exports.optionalAuth = optionalAuth;
