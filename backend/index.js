// index.js — Point d'entrée EduBridge Backend
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
app.use('/api/utilisateurs', require('./routes/utilisateurRoutes'));
app.use('/api/instituts',    require('./routes/institutRoutes'));
app.use('/api/programmes',   require('./routes/programmeRoutes'));
app.use('/api/candidatures', require('./routes/candidatureRoutes'));
app.use('/api/favoris',        require('./routes/favoriRoutes'));
app.use('/api/notifications',  require('./routes/notificationRoutes'));

// ── Route de santé ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'EduBridge' }));

// ── Démarrage ─────────────────────────────────────────────────────────
const start = async () => {
  try {
    // Vérifie la connexion à PostgreSQL (le schéma est géré par les migrations)
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie.');
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
  } catch (err) {
    console.error('❌ Erreur de démarrage :', err.message);
    process.exit(1);
  }
};

start();
