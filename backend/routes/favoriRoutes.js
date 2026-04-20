// routes/favoriRoutes.js — favoris Candidat ↔ Programme
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/favoriController');

router.get   ('/mine',          auth, restrictTo('candidat'), ctrl.getMesFavoris);
router.post  ('/',              auth, restrictTo('candidat'), ctrl.toggleFavori);
router.delete('/:programme_id', auth, restrictTo('candidat'), ctrl.deleteFavori);

module.exports = router;
