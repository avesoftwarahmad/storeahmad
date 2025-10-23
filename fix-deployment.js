#!/usr/bin/env node

// Fix deployment issues script
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing deployment issues...');

// 1. Update frontend environment to use correct API URL
const frontendEnvPath = path.join(__dirname, 'apps/storefront/.env.production');
const frontendEnvContent = `# Production Environment Variables
# This file will be used when deploying to Vercel/Render
# For unified deployment (backend + frontend together), use the same domain

# Replace with your actual Render service URL
# Format: https://your-service-name.onrender.com
VITE_API_URL=https://shopmart-unified.onrender.com
VITE_ENV=production
`;

fs.writeFileSync(frontendEnvPath, frontendEnvContent);
console.log('✅ Updated frontend environment variables');

// 2. Create a simple test endpoint
const testEndpointPath = path.join(__dirname, 'apps/api/src/routes/test.js');
const testEndpointContent = `const express = require('express');
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
`;

fs.writeFileSync(testEndpointPath, testEndpointContent);
console.log('✅ Created test endpoint');

// 3. Update server.js to include test route
const serverPath = path.join(__dirname, 'apps/api/src/server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('testRouter')) {
  // Add test router import
  serverContent = serverContent.replace(
    "const { assistantRouter } = require('./assistant/engine');",
    "const { assistantRouter } = require('./assistant/engine');\nconst testRouter = require('./routes/test');"
  );
  
  // Add test route
  serverContent = serverContent.replace(
    "app.use('/api/assistant', assistantRouter);",
    "app.use('/api/assistant', assistantRouter);\napp.use('/api/test', testRouter);"
  );
  
  fs.writeFileSync(serverPath, serverContent);
  console.log('✅ Added test route to server');
}

console.log('\n🎉 Deployment fixes applied!');
console.log('\nNext steps:');
console.log('1. Deploy to Render');
console.log('2. Test the API: https://your-service-name.onrender.com/api/test');
console.log('3. Test the health endpoint: https://your-service-name.onrender.com/api/health');
console.log('4. Test products: https://your-service-name.onrender.com/api/products');