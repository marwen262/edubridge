// routes/historiqueRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const ctrl   = require('../controllers/historiqueController');

router.get('/', auth, isAdmin, ctrl.getAll);

module.exports = router;
