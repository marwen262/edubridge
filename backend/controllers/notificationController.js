// controllers/notificationController.js — gestion des notifications d'un utilisateur
const { Notification } = require('../models');

// GET /api/notifications/mine — notifications de l'utilisateur connecté
exports.getMesNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { utilisateur_id: req.user.id },
      order: [['cree_le', 'DESC']],
      limit: 50,
    });
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// GET /api/notifications/non-lues/count — nombre de notifications non lues
exports.getCountNonLues = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { utilisateur_id: req.user.id, est_lue: false },
    });
    return res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PATCH /api/notifications/:id/lire — marquer comme lue
exports.marquerLue = async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, utilisateur_id: req.user.id },
    });
    if (!notif) return res.status(404).json({ message: 'Ressource introuvable.' });
    await notif.update({ est_lue: true });
    return res.status(200).json({ message: 'Notification marquée comme lue.', notification: notif });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// PATCH /api/notifications/lire-tout — marquer toutes comme lues
exports.marquerToutesLues = async (req, res) => {
  try {
    await Notification.update(
      { est_lue: true },
      { where: { utilisateur_id: req.user.id, est_lue: false } }
    );
    return res.status(200).json({ message: 'Toutes les notifications marquées comme lues.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};
