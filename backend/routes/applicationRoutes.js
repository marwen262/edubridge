// routes/applicationRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { isAdmin, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const ctrl   = require('../controllers/applicationController');

// Upload multi-fichiers pour la création de candidature
const applicationUpload = upload.fields([
  { name: 'diplomaFile',       maxCount: 1 },
  { name: 'pieceIdentiteFile', maxCount: 1 },
  { name: 'photoFile',         maxCount: 1 },
]);

// ATTENTION : les routes fixes doivent être avant /:id
router.get('/mine',              auth, restrictTo('candidate'),           ctrl.getMine);
router.get('/institute/list',    auth, restrictTo('institute'),           ctrl.getForInstitute);
router.get('/',                  auth, isAdmin,                           ctrl.getAll);
router.get('/:id',               auth,                                    ctrl.getOne);

router.post('/',                 auth, restrictTo('candidate'), applicationUpload, ctrl.create);

router.put('/:id/assign',            auth, isAdmin,                           ctrl.assign);
router.put('/:id/institute-decision', auth, restrictTo('institute'),           ctrl.instituteDecision);
router.put('/:id/final-decision',    auth, isAdmin,                           ctrl.finalDecision);

router.delete('/:id',            auth, isAdmin,                           ctrl.remove);

module.exports = router;
