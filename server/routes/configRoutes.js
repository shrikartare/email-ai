const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/configController');

router.get('/', ctrl.getConfig);
router.put('/', ctrl.updateConfig);

module.exports = router;
