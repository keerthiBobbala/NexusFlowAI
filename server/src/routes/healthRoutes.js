const express = require('express');
const { dbState } = require('../config/db');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, mode: dbState.mode });
});

module.exports = router;
