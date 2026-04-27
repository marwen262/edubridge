// routes/utilisateurRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/utilisateurController');

router.get   ('/',    auth, isAdmin, ctrl.getAllUsers);
router.get   ('/:id', auth,          ctrl.getUserById);
router.put   ('/:id', auth,          ctrl.updateUser);
router.delete('/:id', auth, isAdmin, ctrl.deleteUser);

module.exports = router;
