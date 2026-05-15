// controllers/authController.js — inscription, connexion, first login, profil courant
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { sequelize, Utilisateur, Candidat, Institut } = require('../models');
const { sendInstitutInviteEmail, sendPasswordResetEmail } = require('../services/emailService');
const notificationService = require('../services/notificationService');

const signToken = (utilisateur) =>
  jwt.sign(
    { id: utilisateur.id, role: utilisateur.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );

// POST /api/auth/register — inscription candidat uniquement
// Les instituts passent par le workflow d'invitation admin (POST /api/instituts)
exports.register = async (req, res) => {
  try {
    const {
      email, password, role,
      prenom, nom, genre, date_naissance, telephone, nationalite,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide.' });
    }

    // Les instituts ne peuvent pas s'auto-inscrire — ils reçoivent une invitation admin
    if (role === 'institut') {
      return res.status(403).json({
        message: 'Les comptes établissement ne peuvent être créés que par un administrateur.',
        code: 'INVITATION_REQUIRED',
      });
    }

    const roleFinal = 'candidat';

    if (!prenom || !nom) {
      return res.status(400).json({
        message: 'Champs obligatoires manquants pour un candidat.',
        requis: ['prenom', 'nom'],
      });
    }

    const existing = await Utilisateur.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email déjà utilisé.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await sequelize.transaction(async (t) => {
      const utilisateur = await Utilisateur.create({
        email,
        mot_de_passe: hashed,
        role: roleFinal,
        first_login_completed: true,
      }, { transaction: t });

      const candidat = await Candidat.create({
        utilisateur_id: utilisateur.id,
        prenom, nom, genre, date_naissance, telephone,
        nationalite: nationalite || null,
      }, { transaction: t });

      return { utilisateur, profil: candidat };
    });

    const token = signToken(result.utilisateur);
    return res.status(201).json({
      message: 'Inscription réussie.',
      token,
      utilisateur: {
        id: result.utilisateur.id,
        email: result.utilisateur.email,
        role: result.utilisateur.role,
        first_login_completed: true,
      },
      profil: result.profil,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
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

    // Compte invité qui n'a pas encore effectué son first login
    if (!utilisateur.first_login_completed || !utilisateur.mot_de_passe) {
      return res.status(403).json({
        message: 'Votre compte n\'est pas encore activé. Veuillez utiliser le lien d\'invitation envoyé par email.',
        code: 'FIRST_LOGIN_REQUIRED',
      });
    }

    const valid = await bcrypt.compare(password, utilisateur.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    // Vérification suspension pour les instituts
    if (utilisateur.role === 'institut') {
      const institut = await Institut.findOne({
        where: { utilisateur_id: utilisateur.id },
        attributes: ['id', 'nom', 'validation_status', 'suspension_reason'],
      });
      if (institut && institut.validation_status === 'suspended') {
        return res.status(403).json({
          message: 'Votre compte a été suspendu par l\'administration.',
          code: 'ACCOUNT_SUSPENDED',
          reason: institut.suspension_reason || null,
        });
      }
    }

    const token = signToken(utilisateur);

    // Charger le profil pour la réponse
    let profil = null;
    if (utilisateur.role === 'institut') {
      profil = await Institut.findOne({
        where: { utilisateur_id: utilisateur.id },
        attributes: ['id', 'nom', 'validation_status'],
      });
    } else if (utilisateur.role === 'candidat') {
      profil = await Candidat.findOne({
        where: { utilisateur_id: utilisateur.id },
        attributes: ['id', 'prenom', 'nom'],
      });
    }

    return res.status(200).json({
      message: 'Connexion réussie.',
      token,
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        first_login_completed: utilisateur.first_login_completed,
      },
      profil,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/auth/premier-login/valider?token=xxx — valide un token d'invitation
exports.validerTokenPremierLogin = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Token manquant.', code: 'TOKEN_MISSING' });
    }

    const utilisateur = await Utilisateur.findOne({
      where: { first_login_token: token },
      attributes: ['id', 'email', 'first_login_completed', 'first_login_expires_at'],
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Lien d\'invitation invalide.', code: 'TOKEN_INVALID' });
    }
    if (utilisateur.first_login_completed) {
      return res.status(410).json({ message: 'Ce lien a déjà été utilisé.', code: 'TOKEN_USED' });
    }
    if (new Date() > new Date(utilisateur.first_login_expires_at)) {
      return res.status(410).json({ message: 'Ce lien d\'invitation a expiré. Contactez l\'administrateur.', code: 'TOKEN_EXPIRED' });
    }

    const institut = await Institut.findOne({
      where: { utilisateur_id: utilisateur.id },
      attributes: ['nom', 'description', 'contact'],
    });

    return res.status(200).json({
      valide: true,
      email: utilisateur.email,
      nom: institut?.nom || null,
      telephone: institut?.contact?.telephone || null,
      description: institut?.description || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/premier-login/terminer — finalise le premier login (password + profil)
exports.terminerPremierLogin = async (req, res) => {
  try {
    const { token, password, nom, telephone, description } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token et mot de passe requis.' });
    }
    if (!nom) {
      return res.status(400).json({ message: 'Nom de l\'établissement requis.' });
    }

    // Validation mot de passe
    const pwdRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!pwdRegex.test(password)) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial (!@#$%^&*).',
      });
    }

    const utilisateur = await Utilisateur.findOne({
      where: { first_login_token: token },
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Lien d\'invitation invalide.', code: 'TOKEN_INVALID' });
    }
    if (utilisateur.first_login_completed) {
      return res.status(410).json({ message: 'Ce lien a déjà été utilisé.', code: 'TOKEN_USED' });
    }
    if (new Date() > new Date(utilisateur.first_login_expires_at)) {
      return res.status(410).json({ message: 'Ce lien d\'invitation a expiré.', code: 'TOKEN_EXPIRED' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await sequelize.transaction(async (t) => {
      // Activer le compte
      await utilisateur.update({
        mot_de_passe: hashed,
        first_login_completed: true,
        first_login_token: null,
        first_login_expires_at: null,
        est_actif: true,
      }, { transaction: t });

      // Compléter le profil Institut minimal + passer en attente de validation admin
      const institut = await Institut.findOne({
        where: { utilisateur_id: utilisateur.id },
        transaction: t,
      });

      if (!institut) {
        throw new Error('Profil institut introuvable.');
      }

      await institut.update({
        nom: nom.trim(),
        description: description?.trim() || null,
        contact: telephone ? { telephone: telephone.trim() } : (institut.contact || null),
        validation_status: 'pending_admin_review',
      }, { transaction: t });

      return { utilisateur, institut };
    });

    const jwtToken = signToken(result.utilisateur);

    // Notifier les admins qu'un institut est prêt à être validé (hors transaction)
    try {
      const admins = await Utilisateur.findAll({ where: { role: 'admin', est_actif: true } });
      await Promise.all(admins.map((admin) =>
        notificationService.creerNotification({
          utilisateur_id: admin.id,
          type: 'systeme',
          titre: 'Institut prêt à valider',
          contenu: `${result.institut.nom} a complété son profil et attend votre validation.`,
          ref_id: result.institut.id,
          ref_type: 'Institut',
        })
      ));
    } catch (notifErr) {
      console.error('[terminerPremierLogin] Notification admin échouée:', notifErr.message);
    }

    return res.status(200).json({
      message: 'Compte activé avec succès. Votre profil est en attente de validation par l\'administrateur.',
      token: jwtToken,
      utilisateur: {
        id: result.utilisateur.id,
        email: result.utilisateur.email,
        role: result.utilisateur.role,
        first_login_completed: true,
      },
      profil: {
        id: result.institut.id,
        nom: result.institut.nom,
        validation_status: result.institut.validation_status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/mot-de-passe/oublie — demande de réinitialisation par email
// Réponse identique que l'email existe ou non (anti-énumération)
exports.demanderResetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email requis.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide.' });
    }

    // Réponse générique pour empêcher l'énumération de comptes
    const reponseGenerique = {
      message: 'Si un compte existe pour cette adresse, un email de réinitialisation vient d\'être envoyé.',
    };

    const utilisateur = await Utilisateur.findOne({ where: { email } });

    // Email inconnu, compte désactivé ou compte non encore activé : on répond positivement
    // mais on n'envoie aucun email (silencieusement)
    if (!utilisateur || !utilisateur.est_actif || !utilisateur.first_login_completed || !utilisateur.mot_de_passe) {
      return res.status(200).json(reponseGenerique);
    }

    // Génération token sécurisé (32 octets aléatoires → 64 caractères hex)
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await utilisateur.update({
      reset_password_token: token,
      reset_password_expires_at: expiresAt,
    });

    try {
      await sendPasswordResetEmail(utilisateur.email, token);
    } catch (mailErr) {
      console.error('[ResetPassword] Échec envoi email :', mailErr.message);
      // Rollback du token pour permettre une nouvelle tentative
      await utilisateur.update({
        reset_password_token: null,
        reset_password_expires_at: null,
      });
      return res.status(500).json({
        message: 'Impossible d\'envoyer l\'email de réinitialisation. Veuillez réessayer ultérieurement.',
      });
    }

    return res.status(200).json(reponseGenerique);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/auth/mot-de-passe/valider-token?token=xxx — valide un token de reset
exports.validerResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Token manquant.', code: 'TOKEN_MISSING' });
    }

    const utilisateur = await Utilisateur.findOne({
      where: { reset_password_token: token },
      attributes: ['id', 'email', 'reset_password_expires_at'],
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Lien de réinitialisation invalide.', code: 'TOKEN_INVALID' });
    }
    if (new Date() > new Date(utilisateur.reset_password_expires_at)) {
      return res.status(410).json({ message: 'Ce lien de réinitialisation a expiré.', code: 'TOKEN_EXPIRED' });
    }

    return res.status(200).json({ valide: true, email: utilisateur.email });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/mot-de-passe/reinitialiser — applique le nouveau mot de passe
exports.reinitialiserPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token et mot de passe requis.' });
    }

    const pwdRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!pwdRegex.test(password)) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial (!@#$%^&*).',
      });
    }

    const utilisateur = await Utilisateur.findOne({
      where: { reset_password_token: token },
    });

    if (!utilisateur) {
      return res.status(404).json({ message: 'Lien de réinitialisation invalide.', code: 'TOKEN_INVALID' });
    }
    if (new Date() > new Date(utilisateur.reset_password_expires_at)) {
      return res.status(410).json({ message: 'Ce lien de réinitialisation a expiré.', code: 'TOKEN_EXPIRED' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await utilisateur.update({
      mot_de_passe: hashed,
      reset_password_token: null,
      reset_password_expires_at: null,
    });

    return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/change-password — change le mot de passe de l'utilisateur connecté
exports.changerMotDePasse = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis.' });
    }

    const pwdRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!pwdRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial (!@#$%^&*).',
      });
    }

    const utilisateur = await Utilisateur.findByPk(req.user.id);
    if (!utilisateur || !utilisateur.mot_de_passe) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const valid = await bcrypt.compare(oldPassword, utilisateur.mot_de_passe);
    if (!valid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await utilisateur.update({ mot_de_passe: hashed });

    return res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/auth/me — utilisateur courant + son profil lié (candidat ou institut)
exports.getMe = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.user.id, {
      attributes: { exclude: ['mot_de_passe', 'jeton_rafraichissement', 'first_login_token'] },
      include: [
        { model: Candidat, as: 'candidat' },
        { model: Institut, as: 'institut' },
      ],
    });
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    return res.status(200).json({ utilisateur });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
