// scripts/reset-schema.js
// ⚠️ DESTRUCTIF : efface intégralement le schéma `public` et le recrée.
// Utilisé uniquement pour la remise à zéro lors du passage au modèle
// migrations + seeders CLI. Ne pas appeler en production.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sequelize = require('../config/database');

(async () => {
  console.log('⚠️  Reset schéma "public"...');
  await sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
  await sequelize.query('CREATE SCHEMA public;');
  console.log('✅ Schéma public recréé (tables + types ENUM supprimés).');
  await sequelize.close();
})().catch((err) => {
  console.error('❌ Reset échoué :', err.message);
  process.exit(1);
});
