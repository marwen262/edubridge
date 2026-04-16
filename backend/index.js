// index.js – Point d'entrée EduBridge Backend
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { sequelize } = require('./models');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares globaux ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serveur de fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/users',        require('./routes/userRoutes'));
app.use('/api/institutes',   require('./routes/instituteRoutes'));
app.use('/api/programs',     require('./routes/programRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/favorites',    require('./routes/favoriteRoutes'));
app.use('/api/countries',    require('./routes/countryRoutes'));
app.use('/api/historiques',  require('./routes/historiqueRoutes'));

// ── Route de santé ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'EduBridge' }));

// ── Démarrage ─────────────────────────────────────────────────────────
const start = async () => {
  try {
    // Synchronise les modèles sans écraser les données existantes
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    console.log('✅ Connexion PostgreSQL établie et modèles synchronisés.');
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
  } catch (err) {
    console.error('❌ Erreur de démarrage :', err.message);
    process.exit(1);
  }
};

start();
