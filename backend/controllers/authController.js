// controllers/authController.js — inscription, connexion, récupération du profil courant
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { sequelize, Utilisateur, Candidat, Institut } = require('../models');

// Génère un token JWT minimal (id + role). Les profils liés sont résolus par le middleware.
const signToken = (utilisateur) =>
  jwt.sign(
    { id: utilisateur.id, role: utilisateur.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );

// POST /api/auth/register — inscription (candidat par défaut, ou institut si role=institut)
exports.register = async (req, res) => {
  try {
    const {
      email, password, role,
      // champs candidat
      prenom, nom, genre, date_naissance, telephone,
      // champs institut
      nom_institut, sigle,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide.' });
    }
    const roleFinal = role === 'institut' ? 'institut' : 'candidat';

    if (roleFinal === 'candidat' && (!prenom || !nom)) {
      return res.status(400).json({
        message: 'Champs obligatoires manquants pour un candidat.',
        requis: ['prenom', 'nom'],
      });
    }
    if (roleFinal === 'institut' && !nom_institut) {
      return res.status(400).json({
        message: 'Champ obligatoire manquant pour un institut.',
        requis: ['nom_institut'],
      });
    }

    const existing = await Utilisateur.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email déjà utilisé.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Transaction : création Utilisateur + profil lié atomique
    const result = await sequelize.transaction(async (t) => {
      const utilisateur = await Utilisateur.create({
        email,
        mot_de_passe: hashed,
        role: roleFinal,
      }, { transaction: t });

      if (roleFinal === 'candidat') {
        const candidat = await Candidat.create({
          utilisateur_id: utilisateur.id,
          prenom, nom, genre, date_naissance, telephone,
        }, { transaction: t });
        return { utilisateur, profil: candidat };
      } else {
        const institut = await Institut.create({
          utilisateur_id: utilisateur.id,
          nom: nom_institut,
          sigle,
        }, { transaction: t });
        return { utilisateur, profil: institut };
      }
    });

    const token = signToken(result.utilisateur);
    return res.status(201).json({
      message: 'Inscription réussie.',
      token,
      utilisateur: {
        id: result.utilisateur.id,
        email: result.utilisateur.email,
        role: result.utilisateur.role,
      },
      profil: result.profil,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/auth/login — connexion par email + mot de passe
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const utilisateur = await Utilisateur.findOne({ where: { email } });
    if (!utilisateur) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }
    if (!utilisateur.est_actif) {
      return res.status(403).json({ message: 'Compte désactivé.' });
    }

    const valid = await bcrypt.compare(password, utilisateur.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const token = signToken(utilisateur);
    return res.status(200).json({
      message: 'Connexion réussie.',
      token,
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/auth/me — utilisateur courant + son profil lié (candidat ou institut)
exports.getMe = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.user.id, {
      attributes: { exclude: ['mot_de_passe', 'jeton_rafraichissement'] },
      include: [
        { model: Candidat, as: 'candidat' },
        { model: Institut, as: 'institut' },
      ],
    });
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    return res.status(200).json({ utilisateur });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
