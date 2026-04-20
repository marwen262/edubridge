// controllers/utilisateurController.js — gestion des comptes Utilisateur + profils Candidat/Institut
const { Utilisateur, Candidat, Institut } = require('../models');

const EXCLUDE_SENSIBLE = { exclude: ['mot_de_passe', 'jeton_rafraichissement'] };

// Champs autorisés en mise à jour côté Candidat
const CHAMPS_CANDIDAT = [
  'prenom', 'nom', 'date_naissance', 'genre', 'telephone',
  'adresse', 'situation_familiale', 'type_bac', 'moyenne_bac',
  'annee_bac', 'langues', 'parcours_academique', 'niveau_actuel',
  'photo_profil',
];

// Champs autorisés en mise à jour côté Institut
const CHAMPS_INSTITUT = [
  'nom', 'sigle', 'description', 'site_web', 'logo',
  'adresse', 'accreditations', 'contact', 'note',
];

// Copie les clés whitelistées du body vers un objet d'updates
function pick(body, keys) {
  const out = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

// GET /api/utilisateurs — admin uniquement
exports.getAllUsers = async (_req, res) => {
  try {
    const utilisateurs = await Utilisateur.findAll({
      attributes: EXCLUDE_SENSIBLE,
      include: [
        { model: Candidat, as: 'candidat' },
        { model: Institut, as: 'institut' },
      ],
      order: [['cree_le', 'DESC']],
    });
    return res.status(200).json({ utilisateurs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/utilisateurs/:id
exports.getUserById = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id, {
      attributes: EXCLUDE_SENSIBLE,
      include: [
        { model: Candidat, as: 'candidat' },
        { model: Institut, as: 'institut' },
      ],
    });
    if (!utilisateur) return res.status(404).json({ message: 'Ressource introuvable.' });
    return res.status(200).json({ utilisateur });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PUT /api/utilisateurs/:id — met à jour le compte + le profil lié (Candidat ou Institut)
exports.updateUser = async (req, res) => {
  try {
    // Auto-édition ou admin uniquement
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) return res.status(404).json({ message: 'Ressource introuvable.' });

    // Champs Utilisateur modifiables
    const updatesUtilisateur = pick(req.body, ['email']);
    if (req.user.role === 'admin' && req.body.est_actif !== undefined) {
      updatesUtilisateur.est_actif = req.body.est_actif;
    }
    if (Object.keys(updatesUtilisateur).length > 0) {
      await utilisateur.update(updatesUtilisateur);
    }

    // Profil candidat
    if (utilisateur.role === 'candidat') {
      const updates = pick(req.body, CHAMPS_CANDIDAT);
      if (Object.keys(updates).length > 0) {
        const candidat = await Candidat.findOne({ where: { utilisateur_id: utilisateur.id } });
        if (candidat) await candidat.update(updates);
      }
    }

    // Profil institut
    if (utilisateur.role === 'institut') {
      const updates = pick(req.body, CHAMPS_INSTITUT);
      if (Object.keys(updates).length > 0) {
        const institut = await Institut.findOne({ where: { utilisateur_id: utilisateur.id } });
        if (institut) await institut.update(updates);
      }
    }

    const updated = await Utilisateur.findByPk(req.params.id, {
      attributes: EXCLUDE_SENSIBLE,
      include: [
        { model: Candidat, as: 'candidat' },
        { model: Institut, as: 'institut' },
      ],
    });
    return res.status(200).json({ message: 'Profil mis à jour.', utilisateur: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// DELETE /api/utilisateurs/:id — admin uniquement (suppression définitive, cascade vers profils)
exports.deleteUser = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) return res.status(404).json({ message: 'Ressource introuvable.' });
    await utilisateur.destroy();
    return res.status(200).json({ message: 'Utilisateur supprimé.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
