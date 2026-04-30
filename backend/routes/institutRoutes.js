// routes/institutRoutes.js — CRUD instituts + workflow validation admin
// IMPORTANT : les routes statiques doivent être déclarées AVANT les routes paramétrées /:id
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { isAdmin, restrictTo, optionalAuth } = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/institutController');

// ── Routes publiques (catalogue) ──────────────────────────────────────
router.get('/', optionalAuth, ctrl.getAllInstituts);

// ── Workflow validation admin (statique, AVANT /:id) ──────────────────
router.get ('/admin/en-attente',    auth, isAdmin, ctrl.listerEnAttente);
router.post('/admin/inviter',       auth, isAdmin, ctrl.createInstitut);

// ── Routes paramétrées ─────────────────────────────────────────────────
router.get   ('/:id',              ctrl.getInstitutById);
router.post  ('/',                 auth, isAdmin, ctrl.createInstitut);
router.put   ('/:id',             auth, restrictTo('admin', 'institut'), ctrl.updateInstitut);
router.delete('/:id',             auth, isAdmin, ctrl.deleteInstitut);

// Actions de validation par id
router.post('/:id/approuver',     auth, isAdmin, ctrl.approuverInstitut);
router.post('/:id/rejeter',       auth, isAdmin, ctrl.rejeterInstitut);
router.post('/:id/suspendre',     auth, isAdmin, ctrl.suspendreInstitut);
router.post('/:id/reactiver',     auth, isAdmin, ctrl.reactiverInstitut);
router.post('/:id/resoumettre',   auth, restrictTo('admin', 'institut'), ctrl.resoumettre);

module.exports = router;
