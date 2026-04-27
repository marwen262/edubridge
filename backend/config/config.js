// config/config.js – Config utilisée par sequelize-cli (migrations).
// Lit les mêmes variables d'environnement que config/database.js.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 5432,
  dialect:  'postgres',
  // Trace les seeders dans SequelizeData pour éviter les doubles exécutions
  seederStorage:      'sequelize',
  seederStorageTableName: 'SequelizeData',
};

module.exports = {
  development: base,
  test:        base,
  production:  base,
};
