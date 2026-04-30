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
//
// Paramètres surchargés via .env :
//   RATE_LIMIT_DISABLED=true       — désactive complètement (dev/tests)
//   RATE_LIMIT_GLOBAL_MAX=600      — plafond global (défaut 600 / 15 min)
//   RATE_LIMIT_LOGIN_MAX=20        — plafond /auth/login (défaut 20 / 15 min)
//   RATE_LIMIT_WINDOW_MIN=15       — fenêtre en minutes (défaut 15)

'use strict';

const rateLimit = require('express-rate-limit');

const MESSAGE_TROP_DE_REQUETES = { message: 'Trop de requêtes, réessayez plus tard.' };

const DISABLED       = process.env.RATE_LIMIT_DISABLED === 'true';
const WINDOW_MIN     = parseInt(process.env.RATE_LIMIT_WINDOW_MIN || '15', 10);
const WINDOW_MS      = WINDOW_MIN * 60 * 1000;
// Defaults généreux pour un SPA : un dashboard typique fait 5-10 requêtes au
// montage, donc 100 req/15 min était trop strict. 600/15 min ≈ 40 req/min,
// confortable en dev sans être permissif en prod (à durcir via env si besoin).
const GLOBAL_MAX     = parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '600', 10);
// 20 tentatives login/15 min/IP — large pour les tests multi-comptes (admin,
// candidat, plusieurs instituts) tout en restant utile contre le brute-force,
// d'autant que `skipSuccessfulRequests: true` ne décompte que les échecs.
const LOGIN_MAX      = parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '20', 10);

// Middleware no-op (transparent) — utilisé quand RATE_LIMIT_DISABLED=true
const noopMiddleware = (_req, _res, next) => next();

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
const limiteurGlobal = DISABLED ? noopMiddleware : rateLimit({
  windowMs: WINDOW_MS,
  max: GLOBAL_MAX,
  standardHeaders: true,    // RateLimit-* (RFC draft)
  legacyHeaders: false,     // X-RateLimit-* (désactivé)
  message: MESSAGE_TROP_DE_REQUETES,
  handler: makeHandler('global'),
});

// ── Limiteur strict login ────────────────────────────────────────────────────
// `skipSuccessfulRequests: true` ne décompte pas les connexions réussies,
// pour ne pas pénaliser un utilisateur qui change de compte fréquemment.
const limiteurLogin = DISABLED ? noopMiddleware : rateLimit({
  windowMs: WINDOW_MS,
  max: LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: MESSAGE_TROP_DE_REQUETES,
  handler: makeHandler('login'),
});

if (DISABLED) {
  console.warn('[RATE LIMIT] ⚠️  désactivé via RATE_LIMIT_DISABLED=true');
} else {
  console.log(
    `[RATE LIMIT] global=${GLOBAL_MAX}/${WINDOW_MIN}min · login=${LOGIN_MAX}/${WINDOW_MIN}min`
  );
}

module.exports = { limiteurGlobal, limiteurLogin };
