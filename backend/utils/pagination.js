// utils/pagination.js — Helpers de pagination pour les controllers
//
// Choix techniques :
// - page et limit lus depuis req.query, parsés en entier, bornés.
// - limit max = 100 pour éviter qu'un client demande 10 000 lignes d'un coup.
// - Renvoie un objet meta utilisable directement dans la réponse JSON sous
//   la clé `pagination`, à côté de la clé ressource existante (programmes,
//   instituts, candidatures…) — préserve la rétrocompatibilité frontend.

'use strict';

const LIMIT_DEFAUT = 10;
const LIMIT_MAX    = 100;
const PAGE_DEFAUT  = 1;

/**
 * Normalise les paramètres de pagination depuis req.query.
 * @param {{ page?: string, limit?: string }} query
 * @returns {{ page: number, limit: number, offset: number }}
 */
function lirePagination(query = {}) {
  const pageBrute  = parseInt(query.page, 10);
  const limitBrute = parseInt(query.limit, 10);

  const page  = Number.isFinite(pageBrute)  && pageBrute  > 0 ? pageBrute  : PAGE_DEFAUT;
  const limit = Number.isFinite(limitBrute) && limitBrute > 0
    ? Math.min(limitBrute, LIMIT_MAX)
    : LIMIT_DEFAUT;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Construit l'objet meta de pagination renvoyé au client.
 * @param {{ total: number, page: number, limit: number }} args
 * @returns {{ total: number, page: number, limit: number, totalPages: number }}
 */
function construirePaginationMeta({ total, page, limit }) {
  return {
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

module.exports = { lirePagination, construirePaginationMeta };
