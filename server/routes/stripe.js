const express = require('express');
const router = express.Router();
const { createCheckoutSession, handleWebhook } = require('../controllers/stripeController');

// Standard JSON endpoint to request a payment session
router.post('/checkout-session', express.json(), createCheckoutSession);

// Webhooks require RAW body parsing for Stripe security signature
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
