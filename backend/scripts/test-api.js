// scripts/test-api.js — Suite de tests end-to-end de toutes les routes API EduBridge
require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { sequelize, Utilisateur } = require('../models');

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const TS = Date.now();

const admin = { email: `admin_test_${TS}@edubridge.test`, password: 'Admin1234!' };
const candidat = { email: `cand_test_${TS}@edubridge.test`, password: 'Cand1234!', prenom: 'Test', nom: 'Candidat' };
const institut = { email: `inst_test_${TS}@edubridge.test`, password: 'Inst1234!', nom_institut: `Institut Test ${TS}` };

const results = [];
function record(method, path, expected, received, ok, note = '') {
  results.push({ method, path, expected, received, ok, note });
}

async function call(method, path, { token, data, params } = {}) {
  try {
    const res = await axios({
      method, url: BASE + path,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data, params,
      validateStatus: () => true,
      timeout: 15000,
    });
    return { status: res.status, body: res.data };
  } catch (e) {
    return { status: 0, body: { error: e.message } };
  }
}

async function ensureAdmin() {
  const hashed = await bcrypt.hash(admin.password, 10);
  await Utilisateur.create({ email: admin.email, mot_de_passe: hashed, role: 'admin' });
}

async function main() {
  console.log('▶️  Connexion DB…');
  await sequelize.authenticate();
  await ensureAdmin();
  console.log('✓ Admin créé:', admin.email);

  // ── HEALTH ─────────────────────────────────────────────────────────
  let r = await call('GET', '/health');
  record('GET', '/health', 200, r.status, r.status === 200);

  // ── AUTH ───────────────────────────────────────────────────────────
  // register candidat nominal
  r = await call('POST', '/auth/register', { data: candidat });
  record('POST', '/auth/register (candidat)', 201, r.status, r.status === 201);
  const candidatToken = r.body?.token;

  // register institut nominal
  r = await call('POST', '/auth/register', { data: { ...institut, role: 'institut' } });
  record('POST', '/auth/register (institut)', 201, r.status, r.status === 201);
  const institutToken = r.body?.token;
  const institutUserId = r.body?.utilisateur?.id;

  // register — email invalide
  r = await call('POST', '/auth/register', { data: { email: 'nope', password: 'x', prenom: 'a', nom: 'b' } });
  record('POST', '/auth/register (email invalide)', 400, r.status, r.status === 400);

  // register — email déjà utilisé
  r = await call('POST', '/auth/register', { data: candidat });
  record('POST', '/auth/register (duplicate)', 409, r.status, r.status === 409);

  // login admin
  r = await call('POST', '/auth/login', { data: admin });
  record('POST', '/auth/login (admin)', 200, r.status, r.status === 200);
  const adminToken = r.body?.token;

  // login candidat
  r = await call('POST', '/auth/login', { data: candidat });
  record('POST', '/auth/login (candidat)', 200, r.status, r.status === 200);

  // login — mauvais mdp
  r = await call('POST', '/auth/login', { data: { email: candidat.email, password: 'wrong' } });
  record('POST', '/auth/login (mdp invalide)', 401, r.status, r.status === 401);

  // /me sans token
  r = await call('GET', '/auth/me');
  record('GET', '/auth/me (no token)', 401, r.status, r.status === 401);

  // /me valide
  r = await call('GET', '/auth/me', { token: candidatToken });
  record('GET', '/auth/me (candidat)', 200, r.status, r.status === 200);
  const candidatUserId = r.body?.utilisateur?.id;

  // ── UTILISATEURS ───────────────────────────────────────────────────
  r = await call('GET', '/utilisateurs', { token: adminToken });
  record('GET', '/utilisateurs (admin)', 200, r.status, r.status === 200);

  r = await call('GET', '/utilisateurs', { token: candidatToken });
  record('GET', '/utilisateurs (candidat forbidden)', 403, r.status, r.status === 403);

  r = await call('GET', `/utilisateurs/${candidatUserId}`, { token: candidatToken });
  record('GET', '/utilisateurs/:id (self)', 200, r.status, r.status === 200);

  r = await call('PUT', `/utilisateurs/${candidatUserId}`, {
    token: candidatToken,
    data: { telephone: '20000000', adresse: 'Tunis' },
  });
  record('PUT', '/utilisateurs/:id (self update)', 200, r.status, r.status === 200);

  r = await call('PUT', `/utilisateurs/${institutUserId}`, {
    token: candidatToken, data: { email: 'hack@x.tn' },
  });
  record('PUT', '/utilisateurs/:id (cross-user forbidden)', 403, r.status, r.status === 403);

  // ── INSTITUTS ──────────────────────────────────────────────────────
  r = await call('GET', '/instituts');
  record('GET', '/instituts (public)', 200, r.status, r.status === 200);
  const institutId = r.body?.instituts?.find?.(i => i.utilisateur_id === institutUserId)?.id
                 || r.body?.instituts?.[0]?.id;

  r = await call('GET', `/instituts/${institutId}`);
  record('GET', '/instituts/:id (public)', 200, r.status, r.status === 200);

  r = await call('POST', '/instituts', {
    token: candidatToken, data: { nom: 'X', utilisateur_id: candidatUserId },
  });
  record('POST', '/instituts (candidat forbidden)', 403, r.status, r.status === 403);

  r = await call('PUT', `/instituts/${institutId}`, {
    token: institutToken, data: { description: 'Institut mis à jour par tests' },
  });
  record('PUT', '/instituts/:id (institut owner)', 200, r.status, r.status === 200);

  // ── PROGRAMMES ─────────────────────────────────────────────────────
  r = await call('GET', '/programmes');
  record('GET', '/programmes (public)', 200, r.status, r.status === 200);

  // create programme as institut
  r = await call('POST', '/programmes', {
    token: institutToken,
    data: {
      titre: 'Master Test IA',
      domaine: 'informatique',
      niveau: 'master',
      mode: 'presentiel',
      description: 'Programme de test',
    },
  });
  record('POST', '/programmes (institut)', 201, r.status, r.status === 201);
  const programmeId = r.body?.programme?.id;

  r = await call('POST', '/programmes', { token: candidatToken, data: { titre: 'X' } });
  record('POST', '/programmes (candidat forbidden)', 403, r.status, r.status === 403);

  r = await call('POST', '/programmes', { token: institutToken, data: {} });
  record('POST', '/programmes (données manquantes)', 400, r.status, r.status === 400);

  r = await call('GET', `/programmes/${programmeId}`);
  record('GET', '/programmes/:id', 200, r.status, r.status === 200);

  r = await call('PUT', `/programmes/${programmeId}`, {
    token: institutToken, data: { description: 'MAJ' },
  });
  record('PUT', '/programmes/:id (owner)', 200, r.status, r.status === 200);

  // ── FAVORIS ────────────────────────────────────────────────────────
  r = await call('POST', '/favoris', { token: candidatToken, data: { programme_id: programmeId } });
  record('POST', '/favoris (toggle add)', 201, r.status, r.status === 201);

  r = await call('GET', '/favoris/mine', { token: candidatToken });
  record('GET', '/favoris/mine', 200, r.status, r.status === 200);

  r = await call('POST', '/favoris', { token: candidatToken, data: {} });
  record('POST', '/favoris (programme_id manquant)', 400, r.status, r.status === 400);

  r = await call('GET', '/favoris/mine', { token: institutToken });
  record('GET', '/favoris/mine (institut forbidden)', 403, r.status, r.status === 403);

  r = await call('DELETE', `/favoris/${programmeId}`, { token: candidatToken });
  record('DELETE', '/favoris/:programme_id', 200, r.status, r.status === 200);

  // ── CANDIDATURES ───────────────────────────────────────────────────
  r = await call('POST', '/candidatures', {
    token: candidatToken, data: { programme_id: programmeId, lettre_motivation: 'Ma motivation' },
  });
  record('POST', '/candidatures (candidat)', 201, r.status, r.status === 201);
  const candidatureId = r.body?.candidature?.id;

  r = await call('POST', '/candidatures', { token: candidatToken, data: {} });
  record('POST', '/candidatures (programme_id manquant)', 400, r.status, r.status === 400);

  r = await call('POST', '/candidatures', { token: institutToken, data: { programme_id: programmeId } });
  record('POST', '/candidatures (institut forbidden)', 403, r.status, r.status === 403);

  r = await call('GET', '/candidatures/mine', { token: candidatToken });
  record('GET', '/candidatures/mine', 200, r.status, r.status === 200);

  r = await call('GET', '/candidatures/institute/list', { token: institutToken });
  record('GET', '/candidatures/institute/list', 200, r.status, r.status === 200);

  r = await call('GET', '/candidatures', { token: adminToken });
  record('GET', '/candidatures (admin)', 200, r.status, r.status === 200);

  r = await call('GET', '/candidatures', { token: candidatToken });
  record('GET', '/candidatures (candidat forbidden)', 403, r.status, r.status === 403);

  if (candidatureId) {
    r = await call('GET', `/candidatures/${candidatureId}`, { token: candidatToken });
    record('GET', '/candidatures/:id (owner)', 200, r.status, r.status === 200);

    r = await call('PUT', `/candidatures/${candidatureId}`, {
      token: candidatToken, data: { lettre_motivation: 'MAJ motivation' },
    });
    record('PUT', '/candidatures/:id', 200, r.status, r.status === 200);

    // Soumettre — peut retourner 400 si docs manquants (on accepte 200 ou 400)
    r = await call('POST', `/candidatures/${candidatureId}/soumettre`, { token: candidatToken });
    record('POST', '/candidatures/:id/soumettre', '200/400', r.status, [200, 400].includes(r.status),
      r.status === 400 ? 'docs manquants (attendu sans upload)' : '');

    // Changer statut — admin (valeur ENUM valide)
    r = await call('PATCH', `/candidatures/${candidatureId}/statut`, {
      token: adminToken, data: { statut: 'en_examen' },
    });
    record('PATCH', '/candidatures/:id/statut (admin, valeur valide)', 200, r.status, r.status === 200);

    r = await call('PATCH', `/candidatures/${candidatureId}/statut`, { token: adminToken, data: {} });
    record('PATCH', '/candidatures/:id/statut (statut manquant)', 400, r.status, r.status === 400);

    // Statut inexistant dans l'ENUM → devrait être 400, mais renvoie 500 (bug à corriger)
    r = await call('PATCH', `/candidatures/${candidatureId}/statut`, {
      token: adminToken, data: { statut: 'valeur_bidon' },
    });
    record('PATCH', '/candidatures/:id/statut (ENUM invalide)', 400, r.status, r.status === 400,
      r.status === 500 ? '⚠️ bug: devrait être 400, workflow ne valide pas l\'ENUM' : '');
  }

  // ── NOTIFICATIONS ──────────────────────────────────────────────────
  r = await call('GET', '/notifications/mine', { token: candidatToken });
  record('GET', '/notifications/mine', 200, r.status, r.status === 200);

  r = await call('GET', '/notifications/non-lues/count', { token: candidatToken });
  record('GET', '/notifications/non-lues/count', 200, r.status, r.status === 200);

  r = await call('PATCH', '/notifications/lire-tout', { token: candidatToken });
  record('PATCH', '/notifications/lire-tout', 200, r.status, r.status === 200);

  r = await call('GET', '/notifications/mine');
  record('GET', '/notifications/mine (no token)', 401, r.status, r.status === 401);

  // ── DELETE (cleanup) ───────────────────────────────────────────────
  if (candidatureId) {
    r = await call('DELETE', `/candidatures/${candidatureId}`, { token: adminToken });
    record('DELETE', '/candidatures/:id (admin)', 200, r.status, r.status === 200);
  }
  if (programmeId) {
    r = await call('DELETE', `/programmes/${programmeId}`, { token: institutToken });
    record('DELETE', '/programmes/:id (owner)', 200, r.status, r.status === 200);
  }

  r = await call('DELETE', `/utilisateurs/${candidatUserId}`, { token: adminToken });
  record('DELETE', '/utilisateurs/:id (admin)', 200, r.status, r.status === 200);

  r = await call('DELETE', `/utilisateurs/${institutUserId}`, { token: adminToken });
  record('DELETE', '/utilisateurs/:id (admin) institut', 200, r.status, r.status === 200);

  // self-cleanup: delete admin via direct DB (can't DELETE self through API cleanly)
  await Utilisateur.destroy({ where: { email: admin.email } });

  // ── RAPPORT ────────────────────────────────────────────────────────
  console.log('\n==================  RAPPORT  ==================');
  console.log('| # | Méthode | Route | Attendu | Reçu | ✓ | Note |');
  results.forEach((t, i) => {
    console.log(`| ${i+1} | ${t.method} | ${t.path} | ${t.expected} | ${t.received} | ${t.ok ? '✅' : '❌'} | ${t.note || ''} |`);
  });
  const pass = results.filter(t => t.ok).length;
  console.log(`\n${pass}/${results.length} tests réussis.`);

  await sequelize.close();
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(async (e) => {
  console.error('💥 Erreur fatale:', e);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
