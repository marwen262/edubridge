// routes/countryRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/countryController');

router.get('/', ctrl.getAll);

module.exports = router;
