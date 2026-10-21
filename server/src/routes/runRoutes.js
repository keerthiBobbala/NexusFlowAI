const express = require('express');
const auth = require('../middleware/auth');
const runController = require('../controllers/runController');

const router = express.Router();

router.use(auth);

router.get('/:id', runController.getRunById);

module.exports = router;
