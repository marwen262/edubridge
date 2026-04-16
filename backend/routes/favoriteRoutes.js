// routes/favoriteRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/favoriteController');

router.get   ('/mine', auth, restrictTo('candidate'), ctrl.getMine);
router.post  ('/',     auth, restrictTo('candidate'), ctrl.toggle);
router.delete('/:id',  auth, restrictTo('candidate'), ctrl.remove);

module.exports = router;
