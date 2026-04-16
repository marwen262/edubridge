// routes/instituteRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { isAdmin, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const ctrl   = require('../controllers/instituteController');

router.get   ('/',    ctrl.getAll);
router.get   ('/:id', ctrl.getOne);
router.post  ('/',    auth, isAdmin,                              upload.single('logo'), ctrl.create);
router.put   ('/:id', auth, restrictTo('admin','institute'),      upload.single('logo'), ctrl.update);
router.delete('/:id', auth, isAdmin,                              ctrl.remove);

module.exports = router;
