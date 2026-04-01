const express = require('express');
const router = express.Router();
const { addScore } = require('../controllers/scoreController');

// Define API endpoint to add score (protected logic)
router.post('/', addScore);

module.exports = router;
