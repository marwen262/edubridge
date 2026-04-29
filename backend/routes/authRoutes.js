// routes/authRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/authController');

router.post('/register',                     ctrl.register);
router.post('/login',                        ctrl.login);
router.get ('/me',                auth,      ctrl.getMe);

// Workflow first login institut (routes publiques — pas d'auth JWT requise)
router.get ('/premier-login/valider',        ctrl.validerTokenPremierLogin);
router.post('/premier-login/terminer',       ctrl.terminerPremierLogin);

module.exports = router;
