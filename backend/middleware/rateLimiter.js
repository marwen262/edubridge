// middleware/rateLimiter.js — Limitation du nombre de requêtes par IP
//
// Choix techniques :
// - express-rate-limit : standard de fait, store mémoire suffisant pour un
//   déploiement mono-instance. Pour un cluster, brancher un store Redis
//   (rate-limit-redis) sans changer la signature des limiteurs.
// - Tracking par IP via req.ip (Express utilise X-Forwarded-For si
//   `app.set('trust proxy', …)` est configuré).
// - Réponse JSON conforme à la convention projet `{ message: '…' }`.
// - Hook `handler` pour tracer les blocages avec un préfixe [RATE LIMIT].

'use strict';

const rateLimit = require('express-rate-limit');

const MESSAGE_TROP_DE_REQUETES = { message: 'Trop de requêtes, réessayez plus tard.' };

// Handler factorisé : log + réponse JSON cohérente
function makeHandler(label) {
  return (req, res, _next, options) => {
    console.warn(
      `[RATE LIMIT] ${label} — IP=${req.ip} method=${req.method} url=${req.originalUrl} ` +
      `limit=${options.max} window=${options.windowMs}ms`
    );
    res.status(options.statusCode).json(MESSAGE_TROP_DE_REQUETES);
  };
}

// ── Limiteur global ──────────────────────────────────────────────────────────
// 100 requêtes / 15 min / IP — protège l'API contre un usage abusif basique.
const limiteurGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,    // RateLimit-* (RFC draft)
  legacyHeaders: false,     // X-RateLimit-* (désactivé)
  message: MESSAGE_TROP_DE_REQUETES,
  handler: makeHandler('global'),
});

// ── Limiteur strict login ────────────────────────────────────────────────────
// 5 tentatives / 15 min / IP — anti brute-force sur /api/auth/login.
// `skipSuccessfulRequests: true` ne décompte pas les connexions réussies,
// pour ne pas pénaliser un utilisateur légitime qui se reconnecte souvent.
const limiteurLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: MESSAGE_TROP_DE_REQUETES,
  handler: makeHandler('login'),
});

module.exports = { limiteurGlobal, limiteurLogin };
