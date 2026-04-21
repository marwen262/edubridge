// routes/notificationRoutes.js — routes notifications
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/notificationController');

// Routes fixes (avant /:id)
router.get  ('/mine',           auth, ctrl.getMesNotifications);
router.get  ('/non-lues/count', auth, ctrl.getCountNonLues);
router.patch('/lire-tout',      auth, ctrl.marquerToutesLues);

// Routes dynamiques
router.patch('/:id/lire',      auth, ctrl.marquerLue);

module.exports = router;
