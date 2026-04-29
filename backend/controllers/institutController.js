// controllers/institutController.js — CRUD instituts + workflow validation admin
const crypto = require('crypto');
const { Op }  = require('sequelize');
const { sequelize, Institut, Utilisateur, Programme } = require('../models');
const { sendInstitutInviteEmail } = require('../services/emailService');

const CHAMPS_EDITABLES = [
  'nom', 'sigle', 'description', 'site_web', 'logo',
  'adresse', 'accreditations', 'contact', 'note',
  'image_couverture', 'taux_acceptation', 'nombre_etudiants',
];

function pick(body, keys) {
  const out = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

// GET /api/instituts — public (catalogue) ou admin (liste complète)
exports.getAllInstituts = async (req, res) => {
  try {
    const { nom, est_verifie, admin_view } = req.query;
    const where = {};

    const isAdmin = req.user?.role === 'admin';

    // Les non-admins ne voient que les instituts approuvés dans le catalogue
    if (!isAdmin || admin_view !== 'true') {
      where.validation_status = 'approved';
    }

    if (nom) where.nom = { [Op.iLike]: `%${nom}%` };
    if (est_verifie !== undefined && isAdmin) where.est_verifie = est_verifie === 'true';

    const instituts = await Institut.findAll({
      where,
      include: [
        { model: Programme, as: 'programmes', attributes: ['id', 'titre', 'domaine', 'niveau', 'est_actif'] },
      ],
      order: [['nom', 'ASC']],
    });
    return res.status(200).json({ instituts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/instituts/:id — public
exports.getInstitutById = async (req, res) => {
  try {
    const institut = await Institut.findByPk(req.params.id, {
      include: [{ model: Programme, as: 'programmes' }],
    });
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });
    return res.status(200).json({ institut });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/instituts — admin : crée une invitation pour un nouvel établissement
exports.createInstitut = async (req, res) => {
  try {
    const { email, nom } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Champ requis : email.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide.' });
    }

    const existing = await Utilisateur.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Cet email est déjà associé à un compte.' });
    }

    // Token sécurisé à usage unique (64 caractères hex = 256 bits d'entropie)
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const result = await sequelize.transaction(async (t) => {
      const utilisateur = await Utilisateur.create({
        email,
        mot_de_passe: null,
        role: 'institut',
        est_actif: true,
        first_login_token: token,
        first_login_expires_at: expiration,
        first_login_completed: false,
      }, { transaction: t });

      const institut = await Institut.create({
        utilisateur_id: utilisateur.id,
        nom: nom?.trim() || null,
        validation_status: 'invited',
        est_verifie: false,
      }, { transaction: t });

      return { utilisateur, institut };
    });

    // Envoi de l'email d'invitation (non bloquant en cas d'échec SMTP)
    try {
      await sendInstitutInviteEmail(email, nom || '', token);
    } catch (emailErr) {
      console.error('Erreur envoi email invitation :', emailErr.message);
    }

    return res.status(201).json({
      message: 'Invitation envoyée. L\'établissement recevra un email avec un lien d\'activation (valable 24h).',
      institut: result.institut,
      utilisateur_id: result.utilisateur.id,
      // En dev (sans SMTP), on expose le token pour faciliter les tests
      ...(process.env.NODE_ENV !== 'production' && { debug_token: token }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/instituts/:id — admin ou institut propriétaire
exports.updateInstitut = async (req, res) => {
  try {
    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (req.user.role === 'institut' && req.user.institut_id !== req.params.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const updates = pick(req.body, CHAMPS_EDITABLES);

    // L'admin peut forcer est_verifie et validation_status
    if (req.user.role === 'admin') {
      if (req.body.est_verifie !== undefined) updates.est_verifie = req.body.est_verifie;
    }

    await institut.update(updates);
    return res.status(200).json({ message: 'Établissement mis à jour.', institut });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/instituts/:id — admin
exports.deleteInstitut = async (req, res) => {
  try {
    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });
    await Utilisateur.destroy({ where: { id: institut.utilisateur_id } });
    return res.status(200).json({ message: 'Établissement supprimé.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/instituts/admin/en-attente — admin : liste des instituts en attente de validation
exports.listerEnAttente = async (req, res) => {
  try {
    const instituts = await Institut.findAll({
      where: {
        validation_status: { [Op.in]: ['pending_admin_review', 'invited'] },
      },
      include: [
        { model: Programme, as: 'programmes', attributes: ['id', 'titre', 'domaine', 'niveau', 'est_actif'] },
        {
          model: Utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'email', 'cree_le', 'first_login_completed'],
        },
      ],
      order: [['cree_le', 'ASC']],
    });
    return res.status(200).json({ instituts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/instituts/:id/approuver — admin : valide un institut → visible dans catalogue
exports.approuverInstitut = async (req, res) => {
  try {
    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (!['pending_admin_review', 'rejected'].includes(institut.validation_status)) {
      return res.status(400).json({
        message: `Impossible d'approuver un institut avec le statut "${institut.validation_status}".`,
      });
    }

    await institut.update({
      validation_status: 'approved',
      est_verifie: true,
      suspension_reason: null,
      suspended_at: null,
      suspended_by: null,
    });

    return res.status(200).json({
      message: 'Institut approuvé et rendu visible dans le catalogue.',
      institut,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/instituts/:id/rejeter — admin : rejette un institut avec motif
exports.rejeterInstitut = async (req, res) => {
  try {
    const { motif } = req.body;
    if (!motif) {
      return res.status(400).json({ message: 'Un motif de rejet est requis.' });
    }

    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (!['pending_admin_review', 'approved'].includes(institut.validation_status)) {
      return res.status(400).json({
        message: `Impossible de rejeter un institut avec le statut "${institut.validation_status}".`,
      });
    }

    await institut.update({
      validation_status: 'rejected',
      est_verifie: false,
      suspension_reason: motif,
    });

    return res.status(200).json({
      message: 'Institut rejeté. L\'établissement peut corriger son profil et resoumettre.',
      institut,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/instituts/:id/resoumettre — institut : resoumet après correction (statut rejected)
exports.resoumettre = async (req, res) => {
  try {
    if (req.user.role === 'institut' && req.user.institut_id !== req.params.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (institut.validation_status !== 'rejected') {
      return res.status(400).json({
        message: 'Seuls les instituts rejetés peuvent resoumettre leur dossier.',
      });
    }

    await institut.update({
      validation_status: 'pending_admin_review',
      suspension_reason: null,
    });

    return res.status(200).json({
      message: 'Dossier resoumis pour validation.',
      institut,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/instituts/:id/suspendre — admin : suspend un institut
exports.suspendreInstitut = async (req, res) => {
  try {
    const { motif } = req.body;
    if (!motif) {
      return res.status(400).json({ message: 'Un motif de suspension est requis.' });
    }

    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (institut.validation_status === 'invited') {
      return res.status(400).json({
        message: 'Impossible de suspendre un institut qui n\'a pas encore activé son compte.',
      });
    }
    if (institut.validation_status === 'suspended') {
      return res.status(400).json({ message: 'Cet institut est déjà suspendu.' });
    }

    await institut.update({
      validation_status: 'suspended',
      est_verifie: false,
      suspension_reason: motif,
      suspended_at: new Date(),
      suspended_by: req.user.id,
    });

    return res.status(200).json({
      message: 'Institut suspendu et retiré du catalogue.',
      institut,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// POST /api/instituts/:id/reactiver — admin : lève la suspension → restore approved
exports.reactiverInstitut = async (req, res) => {
  try {
    const institut = await Institut.findByPk(req.params.id);
    if (!institut) return res.status(404).json({ message: 'Ressource introuvable.' });

    if (institut.validation_status !== 'suspended') {
      return res.status(400).json({ message: 'Cet institut n\'est pas suspendu.' });
    }

    await institut.update({
      validation_status: 'approved',
      est_verifie: true,
      suspension_reason: null,
      suspended_at: null,
      suspended_by: null,
    });

    return res.status(200).json({
      message: 'Institut réactivé et remis dans le catalogue.',
      institut,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
