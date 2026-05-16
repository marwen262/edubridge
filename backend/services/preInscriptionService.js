'use strict';
const path        = require('path');
const fs          = require('fs');
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
        attributes: ['nom', 'sigle', 'logo', 'adresse', 'contact'],
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

    // ── Palette ──────────────────────────────────────────────────────────
    const NAVY   = '#1A3A5C';
    const BLUE   = '#1D6CE5';
    const GRIS   = '#6B7280';
    const GRIS_L = '#9CA3AF';
    const NOIR   = '#111827';

    const margin = 60;
    const pageW  = doc.page.width;
    const pageH  = doc.page.height;
    const colW   = pageW - 2 * margin;

    const cand       = pi.candidat  || {};
    const prog       = pi.programme || {};
    const inst       = pi.institut  || {};
    const nomComplet = [cand.prenom, cand.nom].filter(Boolean).join(' ');
    const piece      = pi.type_piece_identite === 'passeport' ? 'Passeport' : 'CIN';
    const dateGen    = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    const ville = (inst.adresse && inst.adresse.ville) ? inst.adresse.ville : 'Tunis';

    // Numéro de référence réaliste
    const hex8   = pi.id.replace(/-/g, '').slice(-8);
    const refNum = String(parseInt(hex8, 16) % 100000).padStart(5, '0');
    const refCode = `REF-EDU-2026-${refNum}`;

    // ────────────────────────────────────────────────────────────────────
    // 1. EN-TÊTE INSTITUTIONNEL (bande navy)
    // ────────────────────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 100).fill(NAVY);

    // Logo de l'établissement (si disponible et accessible)
    let textStartX = margin;
    if (inst.logo) {
      const logoAbsPath = path.join(__dirname, '..', inst.logo.replace(/^\//, ''));
      if (fs.existsSync(logoAbsPath)) {
        try {
          doc.image(logoAbsPath, margin, 12, { fit: [76, 76] });
          textStartX = margin + 86;
        } catch (_) { /* logo inaccessible — on continue sans */ }
      }
    }

    const nameAreaW = pageW - textStartX - margin - 90;
    doc.fillColor('white')
       .fontSize(22).font('Helvetica-Bold')
       .text(inst.nom || 'Établissement', textStartX, 18, { width: nameAreaW });
    doc.fillColor(GRIS_L)
       .fontSize(9).font('Helvetica')
       .text("Établissement d'enseignement supérieur privé", textStartX, 50, { width: nameAreaW });

    // Mention EduBridge discrète en haut à droite
    doc.fillColor(GRIS_L)
       .fontSize(8).font('Helvetica')
       .text('via EduBridge', pageW - margin - 80, 20, { width: 80, align: 'right' });

    // ────────────────────────────────────────────────────────────────────
    // 2. ENCADRÉ TITRE DU DOCUMENT
    // ────────────────────────────────────────────────────────────────────
    const titleBoxY = 112;
    doc.rect(margin, titleBoxY, colW, 54).fillAndStroke('#EEF2FF', NAVY);
    doc.fillColor(NAVY)
       .fontSize(15).font('Helvetica-Bold')
       .text("ATTESTATION D'ACCEPTATION PROVISOIRE", margin, titleBoxY + 9, {
         align: 'center', width: colW,
       });
    doc.fillColor(BLUE)
       .fontSize(10).font('Helvetica')
       .text('Année universitaire 2026 / 2027', margin, titleBoxY + 33, {
         align: 'center', width: colW,
       });

    // ────────────────────────────────────────────────────────────────────
    // 3. LIGNE MÉTA (référence + date d'émission)
    // ────────────────────────────────────────────────────────────────────
    const metaY = titleBoxY + 64;
    doc.fillColor(GRIS)
       .fontSize(9).font('Helvetica')
       .text(`Référence : ${refCode}`, margin, metaY);
    doc.fillColor(GRIS)
       .fontSize(9).font('Helvetica')
       .text(`Date d'émission : ${dateGen}`, margin, metaY, { align: 'right', width: colW });

    doc.moveTo(margin, metaY + 16).lineTo(pageW - margin, metaY + 16)
       .strokeColor('#D1D5DB').lineWidth(0.5).stroke();

    doc.x = margin;
    doc.y = metaY + 26;

    // ────────────────────────────────────────────────────────────────────
    // 4. PARAGRAPHE D'ACCEPTATION OFFICIELLE
    // ────────────────────────────────────────────────────────────────────
    const acceptTxt =
      `${inst.nom || "L'établissement"} a le plaisir de confirmer l'acceptation provisoire ` +
      `de ${nomComplet || 'le candidat'} dans le programme « ${prog.titre || '—'} » ` +
      `(${_cap(prog.niveau) || 'N/A'}) pour l'année universitaire 2026/2027. ` +
      "Cette décision fait suite à l'examen de son dossier de candidature et à " +
      "l'évaluation positive de ses qualifications académiques.";

    doc.fontSize(11).font('Helvetica').fillColor(NOIR)
       .text(acceptTxt, { align: 'justify', width: colW, lineGap: 2 });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(NAVY)
       .text(
         "Cette acceptation reste soumise à la validation administrative finale " +
         "et au règlement des frais de scolarité.",
         { align: 'justify', width: colW, lineGap: 2 }
       );
    doc.moveDown(1.2);

    // ────────────────────────────────────────────────────────────────────
    // 5. INFORMATIONS DU CANDIDAT
    // ────────────────────────────────────────────────────────────────────
    _titreSection(doc, 'Informations du candidat', BLUE, margin, pageW);

    _lignes(doc, NOIR, GRIS, [
      ['Nom complet',          nomComplet],
      ['Date de naissance',    _fmtDate(pi.date_naissance)],
      ['Nationalité',          _cap(pi.nationalite)],
      [piece,                  pi.numero_piece_identite],
      ['Adresse',              pi.adresse_complete],
      ['Ville / Code postal',  [pi.ville, pi.code_postal].filter(Boolean).join(' – ')],
      ['Pays',                 pi.pays],
      ['Téléphone',            pi.telephone],
    ]);
    doc.moveDown(0.8);

    // ────────────────────────────────────────────────────────────────────
    // 6. PROGRAMME ADMIS
    // ────────────────────────────────────────────────────────────────────
    _titreSection(doc, 'Programme admis', BLUE, margin, pageW);

    _lignes(doc, NOIR, GRIS, [
      ['Intitulé',       prog.titre],
      ['Niveau',         _cap(prog.niveau)],
      ['Domaine',        _cap(prog.domaine)],
      ['Établissement',  inst.nom],
    ]);
    doc.moveDown(0.8);

    // ────────────────────────────────────────────────────────────────────
    // 7. CONDITIONS DE L'INSCRIPTION DÉFINITIVE
    // ────────────────────────────────────────────────────────────────────
    _titreSection(doc, "Conditions de l'inscription définitive", BLUE, margin, pageW);

    for (const cond of [
      "1. Présentation des originaux des diplômes et relevés de notes dans un délai de 30 jours.",
      "2. Validation administrative du dossier par le service des admissions.",
      "3. Règlement intégral des frais d'inscription pour l'année universitaire 2026/2027.",
      "4. Signature de la charte de l'étudiant et du règlement intérieur de l'établissement.",
    ]) {
      doc.fontSize(10).font('Helvetica').fillColor(NOIR)
         .text(cond, margin + 8, doc.y, { width: colW - 8 });
      doc.moveDown(0.3);
    }
    doc.moveDown(0.8);

    // ────────────────────────────────────────────────────────────────────
    // 8. BLOC SIGNATURE ET CACHET
    // ────────────────────────────────────────────────────────────────────
    const sigY = doc.y;
    doc.moveTo(margin, sigY).lineTo(pageW - margin, sigY)
       .strokeColor('#D1D5DB').lineWidth(0.5).stroke();

    const sigContentY = sigY + 14;

    // Colonne gauche — représentant et signature
    doc.fontSize(10).font('Helvetica-Bold').fillColor(NOIR)
       .text('Le Responsable des admissions', margin, sigContentY);
    doc.fontSize(9).font('Helvetica').fillColor(GRIS)
       .text(inst.nom || 'Établissement', margin, doc.y);

    const sigImgPath = path.join(__dirname, '..', 'uploads', 'demo-signature.png');
    if (fs.existsSync(sigImgPath)) {
      try {
        doc.image(sigImgPath, margin, sigContentY + 24, { height: 44, fit: [130, 44] });
      } catch (_) { /* fichier inaccessible */ }
    }

    doc.fontSize(9).font('Helvetica').fillColor(GRIS)
       .text(`Fait à ${ville}, le ${dateGen}`, margin, sigContentY + 74, { width: 200 });

    // Colonne droite — cachet officiel
    const cachetSize = 78;
    const cachetX    = pageW - margin - cachetSize - 8;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(NOIR)
       .text('Cachet officiel', cachetX - 8, sigContentY, { width: cachetSize + 16, align: 'center' });

    const cachetImgPath = path.join(__dirname, '..', 'uploads', 'demo-cachet.png');
    if (fs.existsSync(cachetImgPath)) {
      try {
        doc.image(cachetImgPath, cachetX, sigContentY + 18, { fit: [cachetSize, cachetSize] });
      } catch (_) { /* fichier inaccessible */ }
    } else {
      // Cercle placeholder lorsque l'image de cachet est absente
      const cx = cachetX + cachetSize / 2;
      const cy = sigContentY + 18 + cachetSize / 2;
      doc.circle(cx, cy, cachetSize / 2).strokeColor(NAVY).lineWidth(1.5).stroke();
      doc.circle(cx, cy, cachetSize / 2 - 5).strokeColor(NAVY).lineWidth(0.5).stroke();
      doc.fontSize(7).font('Helvetica-Bold').fillColor(NAVY)
         .text('CACHET\nOFFICIEL', cx - 22, cy - 10, { width: 44, align: 'center' });
    }

    // ────────────────────────────────────────────────────────────────────
    // 9. PIED DE PAGE — mention EduBridge discrète
    // ────────────────────────────────────────────────────────────────────
    const footerY = pageH - 28;
    doc.moveTo(margin, footerY - 10).lineTo(pageW - margin, footerY - 10)
       .strokeColor('#E5E7EB').lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(GRIS_L)
       .text(
         "Émis par l'établissement via la plateforme EduBridge · " +
         "Document généré électroniquement · Non opposable sans cachet officiel",
         margin, footerY, { align: 'center', width: colW }
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
