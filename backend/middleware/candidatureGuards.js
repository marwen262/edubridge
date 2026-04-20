// middleware/candidatureGuards.js — garde-fous sur les routes de candidatures
const { Candidature, Programme } = require('../models');
const { STATUTS_TERMINAUX } = require('../services/candidatureWorkflow');

// Interdit toute modification sur une candidature en statut terminal (acceptee/refusee)
exports.interdireStatutTerminal = async (req, res, next) => {
  try {
    const candidature_id = req.params.id;
    if (!candidature_id) return next();

    const candidature = await Candidature.findByPk(candidature_id);
    if (!candidature) {
      return res.status(404).json({ message: 'Candidature introuvable.' });
    }

    if (STATUTS_TERMINAUX.includes(candidature.statut)) {
      return res.status(400).json({
        message: `Candidature en statut terminal « ${candidature.statut} » : aucune modification autorisée.`,
        statut: candidature.statut,
      });
    }

    req.candidature = candidature;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur (garde).', error: err.message });
  }
};

// Vérifie la propriété du dossier selon le rôle connecté
exports.verifierPropriete = async (req, res, next) => {
  try {
    const { role, candidat_id, institut_id } = req.user;
    const candidature = req.candidature || await Candidature.findByPk(req.params.id, {
      include: [{ model: Programme, as: 'programme', attributes: ['id', 'institut_id'] }],
    });
    if (!candidature) {
      return res.status(404).json({ message: 'Candidature introuvable.' });
    }

    if (role === 'admin') return next(); // admin accès total

    if (role === 'candidat' && candidature.candidat_id !== candidat_id) {
      return res.status(403).json({ message: 'Accès refusé : ce dossier ne vous appartient pas.' });
    }

    if (role === 'institut') {
      const prog = candidature.programme || await Programme.findByPk(candidature.programme_id, {
        attributes: ['id', 'institut_id'],
      });
      if (prog?.institut_id !== institut_id) {
        return res.status(403).json({ message: 'Accès refusé : ce dossier ne concerne pas votre institut.' });
      }
    }

    req.candidature = candidature;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur (propriété).', error: err.message });
  }
};
