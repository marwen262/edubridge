'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/demandeAccesController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.post('/',                                              ctrl.creer);
router.get('/',          authMiddleware, isAdmin,            ctrl.listerToutes);
router.post('/:id/approuver', authMiddleware, isAdmin,       ctrl.approuver);
router.post('/:id/rejeter',   authMiddleware, isAdmin,       ctrl.rejeter);

module.exports = router;
