// routes/programmeRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/programmeController');

router.get   ('/',    ctrl.getAllProgrammes);
router.get   ('/:id', ctrl.getProgrammeById);
router.post  ('/',    auth, restrictTo('admin', 'institut'), ctrl.createProgramme);
router.put   ('/:id', auth, restrictTo('admin', 'institut'), ctrl.updateProgramme);
router.delete('/:id', auth, restrictTo('admin', 'institut'), ctrl.deleteProgramme);

module.exports = router;
