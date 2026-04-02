const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

// Stripe webhook must use raw body parsing. We mount it Before express.json.
// The route internally handles express.raw() logic so let's import the route module.
const stripeRoutes = require('./routes/stripe');
app.use('/api/stripe', stripeRoutes);

// Apply JSON parsing middleware for the rest
app.use(express.json());

// Routes
const scoreRoutes = require('./routes/scores');
const drawRoutes = require('./routes/draws');

app.use('/api/scores', scoreRoutes);
app.use('/api/draws', drawRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Platform API is active', time: new Date() });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
