// services/emailService.js — envoi d'emails transactionnels via SMTP
'use strict';

const nodemailer = require('nodemailer');

// ── Configuration ─────────────────────────────────────────────────────────────

const FROM_ADDRESS = process.env.SMTP_FROM    || 'EduBridge <noreply@edubridge.tn>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Toutes les vars SMTP requises dès que SMTP_HOST est présent
const SMTP_REQUIRED = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

// ── Validation de la configuration ───────────────────────────────────────────

/**
 * Vérifie la cohérence de la config SMTP.
 * Retourne { ready: true } ou { ready: false, reason: string }.
 */
function checkSmtpConfig() {
  if (!process.env.SMTP_HOST) {
    return { ready: false, reason: 'SMTP_HOST absent — mode console activé' };
  }

  const missing = SMTP_REQUIRED.filter(v => !process.env[v]);
  if (missing.length) {
    return {
      ready: false,
      reason: `Configuration SMTP incomplète — variables manquantes : ${missing.join(', ')}`,
    };
  }

  return { ready: true };
}

// ── Transporteur SMTP (singleton + vérification paresseuse) ──────────────────

let _transporter      = null;
let _smtpVerified     = false;

/**
 * Retourne le transporteur Nodemailer prêt à l'emploi.
 * - Crée le singleton à la première demande.
 * - Vérifie la connexion SMTP une seule fois (`transporter.verify()`).
 * - Retourne null si SMTP n'est pas configuré (mode console).
 * @throws {Error} si SMTP est configuré mais la connexion échoue.
 */
async function getTransporteur() {
  const config = checkSmtpConfig();

  if (!config.ready) {
    // Log de niveau warn uniquement si SMTP_HOST est défini mais config incomplète
    if (process.env.SMTP_HOST) {
      console.warn(`[EmailService] ⚠️  ${config.reason}`);
    }
    return null;
  }

  // Création du singleton
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Timeouts production — évite de bloquer indéfiniment sur un SMTP mort
      connectionTimeout: 10_000,
      greetingTimeout:   10_000,
      socketTimeout:     30_000,
    });
  }

  // Vérification SMTP au premier appel uniquement
  if (!_smtpVerified) {
    try {
      await _transporter.verify();
      _smtpVerified = true;
      console.log(`[EmailService] ✓ Connexion SMTP vérifiée — host=${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
    } catch (err) {
      // Reset pour réessayer si le serveur SMTP redevient disponible
      _transporter = null;
      const msg = `Connexion SMTP impossible — ${err.message}`;
      console.error(`[EmailService] ✗ ${msg}`);
      throw new Error(msg);
    }
  }

  return _transporter;
}

// ── Moteur d'envoi centralisé ─────────────────────────────────────────────────

/**
 * Envoie un email transactionnel.
 * En mode console (SMTP absent), affiche les informations en stdout.
 *
 * @param {{ to: string, subject: string, html: string, text: string }} opts
 * @throws {Error} si SMTP est configuré mais l'envoi échoue.
 */
async function envoyerEmail({ to, subject, html, text }) {
  const transporteur = await getTransporteur();

  if (!transporteur) {
    // Mode développement : simulation console
    console.log('\n' + '═'.repeat(64));
    console.log('[EmailService] EMAIL SIMULÉ (aucun SMTP configuré)');
    console.log(`  À      : ${to}`);
    console.log(`  Sujet  : ${subject}`);
    console.log(`  Corps  :\n${text.split('\n').map(l => '  ' + l).join('\n')}`);
    console.log('═'.repeat(64) + '\n');
    return;
  }

  try {
    const info = await transporteur.sendMail({ from: FROM_ADDRESS, to, subject, html, text });
    console.log(`[EmailService] ✓ Email envoyé — to=${to} messageId=${info.messageId}`);
  } catch (err) {
    console.error(`[EmailService] ✗ Échec envoi — to=${to} error=${err.message}`);
    throw new Error(`Impossible d'envoyer l'email à ${to} : ${err.message}`);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

function buildInvitationTemplate(nomAffiche, lien) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation EduBridge</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%); padding: 40px 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 16px; margin: 8px 0 0; }
    .body { padding: 40px; }
    .body h2 { color: #1D1D1F; font-size: 22px; font-weight: 600; margin: 0 0 16px; }
    .body p { color: #6E6E73; font-size: 16px; line-height: 1.6; margin: 0 0 20px; }
    .cta { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 100px; font-size: 16px; font-weight: 600; letter-spacing: -0.2px; }
    .info-box { background: #F5F5F7; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .info-box p { color: #3A3A3C; font-size: 14px; margin: 0; line-height: 1.5; }
    .steps { margin: 24px 0; }
    .step { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
    .step-num { background: #007AFF; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .step-text { color: #3A3A3C; font-size: 15px; line-height: 1.5; padding-top: 3px; }
    .footer { padding: 24px 40px; border-top: 1px solid #E5E5EA; text-align: center; }
    .footer p { color: #98989D; font-size: 13px; margin: 0; line-height: 1.6; }
    .link-fallback { word-break: break-all; color: #007AFF; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EduBridge</h1>
      <p>Plateforme de mise en relation — Instituts d'ingénieurs</p>
    </div>
    <div class="body">
      <h2>Bienvenue sur EduBridge !</h2>
      <p>
        L'administrateur de la plateforme vous invite à rejoindre <strong>EduBridge</strong>
        en tant qu'établissement partenaire pour <strong>${nomAffiche}</strong>.
      </p>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">Cliquez sur le bouton ci-dessous pour activer votre compte</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">Définissez votre mot de passe sécurisé</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">Complétez le profil minimal de votre établissement</div>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <div class="step-text">Accédez à votre tableau de bord et publiez vos programmes</div>
        </div>
      </div>
      <div class="cta">
        <a href="${lien}" class="btn">Activer mon compte</a>
      </div>
      <div class="info-box">
        <p>
          &#9200; <strong>Ce lien est valable 24 heures</strong> à compter de la réception de cet email.
          Après expiration, contactez l'administrateur pour obtenir un nouvel accès.
        </p>
      </div>
      <p>Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
    </div>
    <div class="footer">
      <p>
        Cet email a été envoyé automatiquement par la plateforme EduBridge.<br>
        Si vous n'attendiez pas cet email, vous pouvez l'ignorer en toute sécurité.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    'Bonjour,',
    '',
    `L'administrateur EduBridge vous invite à rejoindre la plateforme pour ${nomAffiche}.`,
    '',
    'Activez votre compte via ce lien (valable 24h) :',
    lien,
    '',
    'Équipe EduBridge',
  ].join('\n');

  return { html, text };
}

function buildResetPasswordTemplate(lien) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe — EduBridge</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F5F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%); padding: 40px 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 16px; margin: 8px 0 0; }
    .body { padding: 40px; }
    .body h2 { color: #1D1D1F; font-size: 22px; font-weight: 600; margin: 0 0 16px; }
    .body p { color: #6E6E73; font-size: 16px; line-height: 1.6; margin: 0 0 20px; }
    .cta { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: #007AFF; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 100px; font-size: 16px; font-weight: 600; letter-spacing: -0.2px; }
    .info-box { background: #F5F5F7; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .info-box p { color: #3A3A3C; font-size: 14px; margin: 0; line-height: 1.5; }
    .warn-box { background: #FFF3CD; border-left: 4px solid #FFC107; border-radius: 12px; padding: 16px 20px; margin: 24px 0; }
    .warn-box p { color: #856404; font-size: 14px; margin: 0; line-height: 1.5; }
    .footer { padding: 24px 40px; border-top: 1px solid #E5E5EA; text-align: center; }
    .footer p { color: #98989D; font-size: 13px; margin: 0; line-height: 1.6; }
    .link-fallback { word-break: break-all; color: #007AFF; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EduBridge</h1>
      <p>Réinitialisation de votre mot de passe</p>
    </div>
    <div class="body">
      <h2>Réinitialisation demandée</h2>
      <p>
        Vous avez demandé à réinitialiser le mot de passe de votre compte EduBridge.
        Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
      </p>
      <div class="cta">
        <a href="${lien}" class="btn">Réinitialiser mon mot de passe</a>
      </div>
      <div class="info-box">
        <p>
          &#9200; <strong>Ce lien est valable 1 heure</strong> à compter de la réception de cet email.
          Après expiration, vous devrez refaire une demande de réinitialisation.
        </p>
      </div>
      <div class="warn-box">
        <p>
          <strong>Vous n'êtes pas à l'origine de cette demande ?</strong><br>
          Ignorez simplement cet email. Votre mot de passe restera inchangé et votre compte est sécurisé.
        </p>
      </div>
      <p>Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
      <p class="link-fallback">${lien}</p>
    </div>
    <div class="footer">
      <p>
        Cet email a été envoyé automatiquement par la plateforme EduBridge.<br>
        Pour toute question, contactez l'équipe support.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    'Bonjour,',
    '',
    'Vous avez demandé à réinitialiser le mot de passe de votre compte EduBridge.',
    '',
    'Réinitialisez votre mot de passe via ce lien (valable 1h) :',
    lien,
    '',
    'Si vous n\'êtes pas à l\'origine de cette demande, ignorez cet email.',
    '',
    'Équipe EduBridge',
  ].join('\n');

  return { html, text };
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Envoie l'email d'invitation à un nouvel institut.
 *
 * @param {string} to          Adresse email du destinataire
 * @param {string} nomInstitut Nom de l'établissement (peut être null)
 * @param {string} token       Token à usage unique (24h)
 * @throws {Error} si SMTP est configuré et l'envoi échoue
 */
async function sendInstitutInviteEmail(to, nomInstitut, token) {
  const nomAffiche = nomInstitut || 'votre établissement';
  const lien       = `${FRONTEND_URL}/first-login?token=${encodeURIComponent(token)}`;
  const subject    = `Invitation à rejoindre EduBridge — Activation de votre compte ${nomAffiche}`;

  const { html, text } = buildInvitationTemplate(nomAffiche, lien);
  await envoyerEmail({ to, subject, html, text });
}

/**
 * Envoie l'email de réinitialisation de mot de passe.
 *
 * @param {string} to    Adresse email du destinataire
 * @param {string} token Token à usage unique (1h)
 * @throws {Error} si SMTP est configuré et l'envoi échoue
 */
async function sendPasswordResetEmail(to, token) {
  const lien    = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Réinitialisation de votre mot de passe EduBridge';

  const { html, text } = buildResetPasswordTemplate(lien);
  await envoyerEmail({ to, subject, html, text });
}

module.exports = { sendInstitutInviteEmail, sendPasswordResetEmail };
