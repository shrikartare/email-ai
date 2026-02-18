const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/knowledgeController');

const upload = multer({ dest: 'uploads/' });

router.get('/', ctrl.getDocs);
router.post('/', upload.single('file'), ctrl.uploadDoc);
router.delete('/:id', ctrl.deleteDoc);
router.patch('/:id/toggle', ctrl.toggleDoc);

module.exports = router;
