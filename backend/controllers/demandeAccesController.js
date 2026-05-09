'use strict';
const { DemandeAcces, Utilisateur, Institut, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const notificationService = require('../services/notificationService');
const { lirePagination, construirePaginationMeta } = require('../utils/pagination');

// ── POST /api/demandes-acces  (public) ────────────────────────────────────────
exports.creer = async (req, res) => {
  try {
    const { nom, email, telephone, presentation } = req.body;

    if (!nom || !nom.trim())
      return res.status(400).json({ message: 'Le nom de l\'établissement est requis.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email))
      return res.status(400).json({ message: 'Adresse e-mail invalide.' });

    if (!telephone || !telephone.trim())
      return res.status(400).json({ message: 'Le numéro de téléphone est requis.' });

    if (!presentation || presentation.trim().length < 20)
      return res.status(400).json({ message: 'La présentation doit contenir au moins 20 caractères.' });

    if (presentation.trim().length > 500)
      return res.status(400).json({ message: 'La présentation ne peut pas dépasser 500 caractères.' });

    const demandeExistante = await DemandeAcces.findOne({
      where: {
        email: email.toLowerCase().trim(),
        statut: { [Op.in]: ['en_attente', 'approuvee'] },
      },
    });
    if (demandeExistante)
      return res.status(409).json({ message: 'Une demande existe déjà pour cette adresse e-mail.' });

    const utilisateurExistant = await Utilisateur.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (utilisateurExistant)
      return res.status(409).json({ message: 'Un compte existe déjà pour cette adresse e-mail.' });

    const demande = await DemandeAcces.create({
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone.trim(),
      presentation: presentation.trim(),
      statut: 'en_attente',
    });

    const admins = await Utilisateur.findAll({ where: { role: 'admin', est_actif: true } });
    await Promise.all(admins.map((admin) =>
      notificationService.creerNotification({
        utilisateur_id: admin.id,
        type: 'systeme',
        titre: 'Nouvelle demande d\'accès',
        contenu: `${nom.trim()} (${email}) souhaite rejoindre EduBridge.`,
        ref_id: demande.id,
        ref_type: 'DemandeAcces',
      })
    ));

    return res.status(201).json({
      message: 'Votre demande a bien été reçue. Notre équipe vous contactera sous 48 heures ouvrées.',
      demande: {
        id: demande.id,
        nom: demande.nom,
        email: demande.email,
        statut: demande.statut,
        cree_le: demande.cree_le,
      },
    });
  } catch (err) {
    console.error('[DemandeAcces] creer:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── GET /api/demandes-acces  (admin) ─────────────────────────────────────────
exports.listerToutes = async (req, res) => {
  try {
    const { page, limit, offset } = lirePagination(req.query);
    const where = {};
    if (req.query.statut) where.statut = req.query.statut;

    const { count, rows } = await DemandeAcces.findAndCountAll({
      where,
      order: [['cree_le', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      demandes: rows,
      pagination: construirePaginationMeta({ total: count, page, limit }),
    });
  } catch (err) {
    console.error('[DemandeAcces] listerToutes:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── POST /api/demandes-acces/:id/approuver  (admin) ──────────────────────────
exports.approuver = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const demande = await DemandeAcces.findByPk(req.params.id, { transaction: t });
    if (!demande) {
      await t.rollback();
      return res.status(404).json({ message: 'Demande introuvable.' });
    }
    if (demande.statut !== 'en_attente') {
      await t.rollback();
      return res.status(400).json({ message: `Cette demande est déjà "${demande.statut}".` });
    }

    const existant = await Utilisateur.findOne({
      where: { email: demande.email },
      transaction: t,
    });
    if (existant) {
      await t.rollback();
      return res.status(409).json({ message: 'Un compte existe déjà pour cet email.' });
    }

    const firstLoginToken = crypto.randomBytes(32).toString('hex');
    const firstLoginExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const utilisateur = await Utilisateur.create({
      id: uuidv4(),
      email: demande.email,
      mot_de_passe: null,
      role: 'institut',
      est_actif: true,
      first_login_token: firstLoginToken,
      first_login_expires_at: firstLoginExpiresAt,
      first_login_completed: false,
    }, { transaction: t });

    await Institut.create({
      id: uuidv4(),
      utilisateur_id: utilisateur.id,
      nom: demande.nom,
      contact: { telephone: demande.telephone },
      est_verifie: false,
      validation_status: 'invited',
    }, { transaction: t });

    demande.statut = 'approuvee';
    demande.traite_par = req.user.id;
    demande.traite_le = new Date();
    await demande.save({ transaction: t });

    await t.commit();

    await emailService.sendInstitutInviteEmail(demande.email, demande.nom, firstLoginToken);

    return res.json({
      message: `Demande approuvée. L'invitation a été envoyée à ${demande.email}.`,
      demande,
    });
  } catch (err) {
    await t.rollback();
    console.error('[DemandeAcces] approuver:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── POST /api/demandes-acces/:id/rejeter  (admin) ────────────────────────────
exports.rejeter = async (req, res) => {
  try {
    const demande = await DemandeAcces.findByPk(req.params.id);
    if (!demande)
      return res.status(404).json({ message: 'Demande introuvable.' });
    if (demande.statut !== 'en_attente')
      return res.status(400).json({ message: `Cette demande est déjà "${demande.statut}".` });

    demande.statut = 'rejetee';
    demande.notes_admin = req.body.notes_admin ?? null;
    demande.traite_par = req.user.id;
    demande.traite_le = new Date();
    await demande.save();

    return res.json({ message: 'Demande rejetée.', demande });
  } catch (err) {
    console.error('[DemandeAcces] rejeter:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
