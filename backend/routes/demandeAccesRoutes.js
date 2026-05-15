'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/demandeAccesController');
const auth = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');

router.post('/',                              ctrl.creer);
router.get('/',          auth, isAdmin,       ctrl.listerToutes);
router.post('/:id/approuver', auth, isAdmin, ctrl.approuver);
router.post('/:id/rejeter',   auth, isAdmin, ctrl.rejeter);

module.exports = router;
