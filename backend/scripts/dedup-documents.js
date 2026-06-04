// scripts/dedup-documents.js
// Nettoie les doublons dans documents_soumis de toutes les candidatures.
// Conserve le DERNIER document uploadé pour chaque nom (telecharge_le desc).
// Idempotent — sans effet si aucun doublon.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sequelize = require('../config/database');
const { Candidature } = require('../models');

(async () => {
  await sequelize.authenticate();

  const candidatures = await Candidature.findAll({
    attributes: ['id', 'documents_soumis'],
  });

  let fixed = 0;

  for (const c of candidatures) {
    const docs = c.documents_soumis;
    if (!Array.isArray(docs) || docs.length === 0) continue;

    // Grouper par nom, garder le plus récent (telecharge_le ou dernier en tableau)
    const parNom = new Map();
    for (const d of docs) {
      if (!d || typeof d.nom !== 'string') continue;
      const existant = parNom.get(d.nom);
      if (!existant) {
        parNom.set(d.nom, d);
      } else {
        // Garder le plus récent
        const dateNew = d.telecharge_le ? new Date(d.telecharge_le) : new Date(0);
        const dateOld = existant.telecharge_le ? new Date(existant.telecharge_le) : new Date(0);
        if (dateNew >= dateOld) parNom.set(d.nom, d);
      }
    }

    const deduped = Array.from(parNom.values());
    if (deduped.length < docs.length) {
      await c.update({ documents_soumis: deduped });
      console.log(`[fix] candidature ${c.id} : ${docs.length} → ${deduped.length} documents`);
      fixed++;
    }
  }

  console.log(`\nTerminé. ${fixed} candidature(s) corrigée(s).`);
  await sequelize.close();
})();
