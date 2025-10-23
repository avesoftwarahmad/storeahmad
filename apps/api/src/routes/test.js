const express = require('express');
const router = express.Router();

// Simple test endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors_origins: process.env.CORS_ORIGINS,
    mongodb_connected: !!process.env.MONGODB_URI
  });
});

module.exports = router;
