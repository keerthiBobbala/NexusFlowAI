const express = require('express');
const auth = require('../middleware/auth');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.use(auth);

router.get('/:id', documentController.getDocumentById);
router.post('/:id/reprocess', documentController.reprocessDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
