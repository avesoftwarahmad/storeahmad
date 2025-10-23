const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import routes
const customersRouter = require('./routes/customers');
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const ordersRouter = require('./routes/orders');
const analyticsRouter = require('./routes/analytics');
const dashboardRouter = require('./routes/dashboard');
const orderSSE = require('./sse/order-status');
const { assistantRouter } = require('./assistant/engine');
const testRouter = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, '../public');

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow configured CORS origins
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve prebuilt frontend if present
app.use(express.static(PUBLIC_DIR));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/test', testRouter);

// SSE endpoint for order tracking
app.get('/api/orders/:id/stream', orderSSE.streamOrderStatus);

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'ahmad store API (Test Mode)',
    version: '1.0.0',
    status: 'ok',
    uptime: process.uptime(),
    mode: 'test (no database)',
    docs: '/api/health'
  });
});

// Support HEAD / to avoid NOT_FOUND on health checks
app.head('/', (req, res) => res.status(204).end());

// Favicon placeholder
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'test',
    mode: 'test (no database)'
  });
});

// 404 handler
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      service: 'ahmad store API (Test Mode)',
      message: 'Frontend not built yet. Please wait for frontend build to complete.',
      mode: 'test (no database)',
      api: {
        health: '/api/health',
        products: '/api/products',
        customers: '/api/customers',
        orders: '/api/orders',
        assistant: '/api/assistant'
      }
    });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'test'}`);
  console.log(`⚠️  Running in TEST MODE (no database connection)`);
  console.log(`🔗 Test the assistant at: http://localhost:${PORT}/api/assistant/info`);
});

module.exports = app;