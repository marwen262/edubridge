// services/notificationService.js — Création des notifications applicatives
const { Notification, Candidat, Programme, Institut } = require('../models');

// Titres lisibles par défaut selon le statut de candidature
const TITRE_STATUT = {
  soumise:       'Candidature soumise',
  en_examen:     'Votre candidature est en cours d\'examen',
  acceptee:      'Candidature acceptée',
  refusee:       'Candidature refusée',
  liste_attente: 'Candidature placée en liste d\'attente',
};

// Helper interne : crée une notification en base + log console
async function creerNotification({
  utilisateur_id, type, titre, contenu, ref_id, ref_type, transaction,
}) {
  const notif = await Notification.create({
    utilisateur_id, type, titre, contenu, ref_id, ref_type,
  }, { transaction });
  console.log(`[NOTIF] → ${utilisateur_id} | ${type} | ${titre}`);
  return notif;
}

// Notifie le candidat d'un changement de statut de sa candidature
exports.notifierChangementStatut = async (candidature, ancien_statut, nouveau_statut, transaction) => {
  const candidat = await Candidat.findByPk(candidature.candidat_id, {
    attributes: ['utilisateur_id'],
  });
  if (!candidat) return;

  const idCourt = candidature.id.substring(0, 8);
  await creerNotification({
    utilisateur_id: candidat.utilisateur_id,
    type: 'statut_candidature',
    titre: TITRE_STATUT[nouveau_statut] || `Statut mis à jour : ${nouveau_statut}`,
    contenu: `Votre candidature #${idCourt} est passée de « ${ancien_statut || 'nouveau'} » à « ${nouveau_statut} ».`,
    ref_id: candidature.id,
    ref_type: 'Candidature',
    transaction,
  });
};

// Notifie l'institut d'une nouvelle candidature soumise sur l'un de ses programmes
exports.notifierNouvelleCandidate = async (candidature, transaction) => {
  const programme = await Programme.findByPk(candidature.programme_id, {
    include: [{ model: Institut, as: 'institut', attributes: ['utilisateur_id'] }],
    attributes: ['id', 'titre', 'institut_id'],
  });
  if (!programme?.institut) return;

  await creerNotification({
    utilisateur_id: programme.institut.utilisateur_id,
    type: 'statut_candidature',
    titre: 'Nouvelle candidature reçue',
    contenu: `Une nouvelle candidature a été déposée pour le programme « ${programme.titre} ».`,
    ref_id: candidature.id,
    ref_type: 'Candidature',
    transaction,
  });
};

exports.creerNotification = creerNotification;
