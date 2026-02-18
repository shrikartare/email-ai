const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientController');

router.get('/', ctrl.getClients);
router.post('/', ctrl.createClient);
router.put('/:id', ctrl.updateClient);
router.delete('/:id', ctrl.deleteClient);

module.exports = router;
