// routes/institutRoutes.js — CRUD instituts
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { isAdmin, restrictTo } = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/institutController');

router.get   ('/',    ctrl.getAllInstituts);
router.get   ('/:id', ctrl.getInstitutById);
router.post  ('/',    auth, isAdmin,                         ctrl.createInstitut);
router.put   ('/:id', auth, restrictTo('admin', 'institut'), ctrl.updateInstitut);
router.delete('/:id', auth, isAdmin,                         ctrl.deleteInstitut);

module.exports = router;
