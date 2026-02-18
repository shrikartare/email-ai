const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emailController');

router.get('/', ctrl.getEmails);
router.post('/fetch', ctrl.fetchEmails);
router.get('/:id', ctrl.getEmail);
router.post('/:id/process', ctrl.processEmail);
router.post('/:id/send', ctrl.sendEmail);
router.post('/:id/escalate', ctrl.escalateEmail);

module.exports = router;
