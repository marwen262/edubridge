'use strict';
const PDFDocument = require('pdfkit');
const { sequelize, PreInscription, Candidature, Candidat, Institut, Programme } = require('../models');
const notif = require('./notificationService');

const CHAMPS_OBLIGATOIRES = [
  'adresse_complete', 'ville', 'pays', 'code_postal',
  'telephone', 'date_naissance', 'nationalite',
  'type_piece_identite', 'numero_piece_identite',
];

const CHAMPS_AUTORISES = [
  ...CHAMPS_OBLIGATOIRES,
  'photo_identite_url',
];

function _estComplete(pi) {
  return CHAMPS_OBLIGATOIRES.every(c => {
    const v = pi[c];
    return v !== null && v !== undefined && String(v).trim() !== '';
  });
}

// Crée ou met à jour la pré-inscription pour une candidature acceptée.
// Si tous les champs obligatoires sont renseignés, passe au statut "completee"
// et notifie l'utilisateur de l'institut (une seule fois).
exports.creerOuCompleter = async (candidatureId, candidatId, donnees) => {
  // Pré-validations hors transaction (lecture seule, pas de risque de doublon)
  const candidature = await Candidature.findByPk(candidatureId);
  if (!candidature) throw { status: 404, message: 'Candidature introuvable.' };
  if (candidature.candidat_id !== candidatId)
    throw { status: 403, message: 'Accès non autorisé.' };
  if (candidature.statut !== 'acceptee')
    throw { status: 400, message: 'La pré-inscription est uniquement accessible pour les candidatures acceptées.' };

  const programme = await Programme.findByPk(candidature.programme_id, {
    attributes: ['id', 'titre', 'niveau', 'domaine', 'institut_id'],
    include: [{ model: Institut, as: 'institut', attributes: ['id', 'utilisateur_id', 'nom'] }],
  });
  if (!programme) throw { status: 404, message: 'Programme introuvable.' };

  const defaults = {
    candidature_id: candidatureId,
    candidat_id:    candidatId,
    institut_id:    programme.institut_id,
    programme_id:   candidature.programme_id,
  };
  for (const c of CHAMPS_AUTORISES) {
    if (donnees[c] !== undefined) defaults[c] = donnees[c];
  }

  let pi;
  let notifierInstitut = false;

  await sequelize.transaction(async (t) => {
    const [record, cree] = await PreInscription.findOrCreate({
      where: { candidature_id: candidatureId },
      defaults,
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!cree) {
      for (const c of CHAMPS_AUTORISES) {
        if (donnees[c] !== undefined) record[c] = donnees[c];
      }
    }

    const etaitCompletee = record.statut === 'completee';

    if (_estComplete(record)) {
      record.statut = 'completee';
      if (!record.completee_le) record.completee_le = new Date();
    }

    await record.save({ transaction: t });

    pi = record;
    notifierInstitut = !etaitCompletee && record.statut === 'completee';
  });

  // Notification hors transaction (non critique si elle échoue)
  if (notifierInstitut && programme.institut) {
    await notif.creerNotification({
      utilisateur_id: programme.institut.utilisateur_id,
      type: 'systeme',
      titre: 'Pré-inscription complétée',
      contenu: `Un candidat a finalisé sa pré-inscription pour le programme « ${programme.titre} ».`,
      ref_id: pi.id,
      ref_type: 'PreInscription',
    });
  }

  return pi;
};

// Retourne null si aucune pré-inscription n'existe encore (état normal).
exports.obtenirParCandidature = async (candidatureId, candidatId) => {
  return PreInscription.findOne({
    where: { candidature_id: candidatureId, candidat_id: candidatId },
  });
};

// Génère un Buffer PDF de l'attestation de pré-inscription.
exports.genererPdf = async (preInscriptionId, candidatId) => {
  const pi = await PreInscription.findByPk(preInscriptionId, {
    include: [
      {
        model: Candidat,
        as: 'candidat',
        attributes: ['prenom', 'nom', 'date_naissance', 'nationalite'],
      },
      {
        model: Institut,
        as: 'institut',
        attributes: ['nom', 'contact'],
      },
      {
        model: Programme,
        as: 'programme',
        attributes: ['titre', 'niveau', 'domaine'],
      },
    ],
  });

  if (!pi) throw { status: 404, message: 'Pré-inscription introuvable.' };
  if (pi.candidat_id !== candidatId) throw { status: 403, message: 'Accès non autorisé.' };
  if (pi.statut !== 'completee')
    throw { status: 400, message: 'L\'attestation est disponible uniquement lorsque la pré-inscription est complétée.' };

  return _construirePdf(pi);
};

// ── Construction PDF ───────────────────────────────────────────────────────

function _construirePdf(pi) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const BLUE  = '#1D6CE5';
    const GRIS  = '#6B7280';
    const NOIR  = '#111827';
    const GREEN = '#059669';
    const margin = 60;
    const pageW  = doc.page.width;

    const refId  = pi.id.substring(0, 8).toUpperCase();
    const dateGen = new Date().toLocaleDateString('fr-FR');

    // ── En-tête ─────────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 88).fill(BLUE);
    doc.fillColor('white')
       .fontSize(26).font('Helvetica-Bold').text('EduBridge', margin, 20);
    doc.fontSize(11).font('Helvetica')
       .text('Plateforme de mise en relation étudiants – instituts', margin, 52);

    doc.fillColor(NOIR).moveDown(3.5);

    // ── Titre document ───────────────────────────────────────────────────
    doc.fontSize(17).font('Helvetica-Bold').fillColor(BLUE)
       .text('Attestation de pré-inscription', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor(GRIS)
       .text(`Référence : ${refId}   |   Générée le : ${dateGen}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── Candidat ────────────────────────────────────────────────────────
    _titreSection(doc, 'Informations du candidat', BLUE, margin, pageW);

    const cand     = pi.candidat || {};
    const nomComplet = [cand.prenom, cand.nom].filter(Boolean).join(' ');
    const piece    = pi.type_piece_identite === 'passeport' ? 'Passeport' : 'CIN';

    _lignes(doc, NOIR, GRIS, [
      ['Nom complet',       nomComplet],
      ['Date de naissance', _fmtDate(pi.date_naissance)],
      ['Nationalité',       _cap(pi.nationalite)],
      [piece,               pi.numero_piece_identite],
      ['Adresse',           pi.adresse_complete],
      ['Ville / Code postal', [pi.ville, pi.code_postal].filter(Boolean).join(' – ')],
      ['Pays',              pi.pays],
      ['Téléphone',         pi.telephone],
    ]);

    doc.moveDown(0.8);

    // ── Programme / Institut ─────────────────────────────────────────────
    _titreSection(doc, 'Programme et établissement', BLUE, margin, pageW);

    const prog = pi.programme || {};
    const inst = pi.institut  || {};

    _lignes(doc, NOIR, GRIS, [
      ['Programme',     prog.titre],
      ['Niveau',        _cap(prog.niveau)],
      ['Domaine',       _cap(prog.domaine)],
      ['Établissement', inst.nom],
    ]);

    doc.moveDown(0.8);

    // ── Statut ───────────────────────────────────────────────────────────
    _titreSection(doc, 'Statut de la pré-inscription', BLUE, margin, pageW);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(GREEN).text('Complétée');
    doc.fontSize(10).font('Helvetica').fillColor(NOIR)
       .text(`Date de complétion : ${_fmtDate(pi.completee_le)}`);

    doc.moveDown(1.5);

    // ── Mention légale ───────────────────────────────────────────────────
    doc.moveTo(margin, doc.y).lineTo(pageW - margin, doc.y)
       .strokeColor('#D1D5DB').lineWidth(0.5).stroke();
    doc.moveDown(0.6);

    doc.fontSize(8.5).font('Helvetica').fillColor(GRIS)
       .text(
         'AVERTISSEMENT : Ce document est une attestation de pré-inscription administrative émise ' +
         'par la plateforme EduBridge. Il ne constitue PAS une admission officielle dans ' +
         "l'établissement et n'engage pas contractuellement celui-ci. Ce document ne peut en " +
         'aucun cas être utilisé à des fins officielles (demande de visa, procédure consulaire ' +
         "ou toute démarche auprès d'une autorité publique). Pour une admission officielle, " +
         "rapprochez-vous directement de l'établissement d'enseignement concerné.",
         { align: 'justify', lineGap: 2 }
       );

    doc.end();
  });
}

function _titreSection(doc, titre, color, margin, pageW) {
  doc.fontSize(12).font('Helvetica-Bold').fillColor(color).text(titre);
  doc.moveDown(0.2);
  doc.moveTo(margin, doc.y).lineTo(pageW - margin, doc.y)
     .strokeColor(color).lineWidth(0.8).stroke();
  doc.moveDown(0.6);
}

function _lignes(doc, noir, gris, lignes) {
  for (const [label, valeur] of lignes) {
    if (!valeur) continue;
    doc.fontSize(10)
       .font('Helvetica-Bold').fillColor(gris).text(label + ' :', { continued: true })
       .font('Helvetica').fillColor(noir).text('  ' + String(valeur));
    doc.moveDown(0.15);
  }
}

function _fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return String(d); }
}

function _cap(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
