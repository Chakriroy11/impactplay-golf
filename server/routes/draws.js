const express = require('express');
const router = express.Router();
const { simulateDraw, publishDraw } = require('../controllers/drawController');

// Define API endpoint to simulate and publish draws.
// In reality these would be protected by an isAdmin middleware.
router.get('/simulate', simulateDraw);
router.post('/publish', publishDraw);

module.exports = router;
