'use strict';
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/preInscriptionController');
const auth    = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/authMiddleware');
const upload  = require('../middleware/upload');

// POST   /api/preinscriptions                         — candidat
router.post('/', auth, restrictTo('candidat'), upload.single('photo_identite'), ctrl.creerOuCompleter);

// GET    /api/preinscriptions/mine/:candidatureId     — candidat
router.get('/mine/:candidatureId', auth, restrictTo('candidat'), ctrl.obtenirMine);

// GET    /api/preinscriptions/:id/pdf                 — candidat
router.get('/:id/pdf', auth, restrictTo('candidat'), ctrl.telechargerPdf);

module.exports = router;
