// routes/authRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get ('/me',       auth, ctrl.getMe);

module.exports = router;
