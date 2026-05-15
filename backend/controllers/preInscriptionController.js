'use strict';
const preInscriptionService = require('../services/preInscriptionService');

// ── POST /api/preinscriptions ─────────────────────────────────────────────────
exports.creerOuCompleter = async (req, res) => {
  try {
    const candidatId = req.user.candidat_id;
    if (!candidatId) return res.status(403).json({ message: 'Profil candidat introuvable.' });

    const { candidature_id } = req.body;
    if (!candidature_id) return res.status(400).json({ message: 'candidature_id est requis.' });

    const donnees = { ...req.body };
    if (req.file) donnees.photo_identite_url = `/uploads/${req.file.filename}`;

    const pi = await preInscriptionService.creerOuCompleter(candidature_id, candidatId, donnees);
    return res.status(200).json({ preInscription: pi });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[PreInscription] creerOuCompleter:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── GET /api/preinscriptions/mine/:candidatureId ──────────────────────────────
exports.obtenirMine = async (req, res) => {
  try {
    const candidatId = req.user.candidat_id;
    if (!candidatId) return res.status(403).json({ message: 'Profil candidat introuvable.' });

    const pi = await preInscriptionService.obtenirParCandidature(
      req.params.candidatureId,
      candidatId
    );
    // null = pas encore créée, c'est un état normal → retourne null sans 404
    return res.json({ preInscription: pi });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[PreInscription] obtenirMine:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── GET /api/preinscriptions/:id/pdf ─────────────────────────────────────────
exports.telechargerPdf = async (req, res) => {
  try {
    const candidatId = req.user.candidat_id;
    if (!candidatId) return res.status(403).json({ message: 'Profil candidat introuvable.' });

    const pdfBuffer = await preInscriptionService.genererPdf(req.params.id, candidatId);

    const nomFichier = `attestation-preinscription-${req.params.id.substring(0, 8)}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomFichier}"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.end(pdfBuffer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('[PreInscription] telechargerPdf:', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
