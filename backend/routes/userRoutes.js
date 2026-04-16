// routes/userRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const ctrl   = require('../controllers/userController');

router.get   ('/',                              ctrl.getAll);
router.get   ('/:id', auth,                                   ctrl.getOne);
router.put   ('/:id', auth, upload.single('diplomaFile'),     ctrl.update);
router.delete('/:id', auth, isAdmin,                          ctrl.remove);

module.exports = router;
