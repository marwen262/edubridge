// routes/programRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/programController');

router.get   ('/',    ctrl.getAll);
router.get   ('/:id', ctrl.getOne);
router.post  ('/',    auth, restrictTo('admin','institute'), ctrl.create);
router.put   ('/:id', auth, restrictTo('admin','institute'), ctrl.update);
router.delete('/:id', auth, restrictTo('admin','institute'), ctrl.remove);

module.exports = router;
