// routes/authRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/authController');

router.post('/register',                     ctrl.register);
router.post('/login',                        ctrl.login);
router.get ('/me',                auth,      ctrl.getMe);
router.post('/change-password',   auth,      ctrl.changerMotDePasse);

// Workflow first login institut (routes publiques — pas d'auth JWT requise)
router.get ('/premier-login/valider',        ctrl.validerTokenPremierLogin);
router.post('/premier-login/terminer',       ctrl.terminerPremierLogin);

// Workflow réinitialisation mot de passe (routes publiques)
router.post('/mot-de-passe/oublie',          ctrl.demanderResetPassword);
router.get ('/mot-de-passe/valider-token',   ctrl.validerResetToken);
router.post('/mot-de-passe/reinitialiser',   ctrl.reinitialiserPassword);

module.exports = router;
