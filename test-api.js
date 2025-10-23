#!/usr/bin/env node

// Simple API test script to verify backend is working
const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'https://shopmart-unified.onrender.com';

async function testAPI() {
  console.log('🔍 Testing API at:', API_URL);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test products endpoint
    console.log('\n2. Testing products endpoint...');
    const productsResponse = await fetch(`${API_URL}/api/products?limit=5`);
    const productsData = await productsResponse.json();
    console.log('✅ Products count:', productsData.products?.length || productsData.length || 'No products');
    
    // Test root endpoint
    console.log('\n3. Testing root endpoint...');
    const rootResponse = await fetch(`${API_URL}/`);
    const rootData = await rootResponse.json();
    console.log('✅ Root response:', rootData);
    
    console.log('\n🎉 API is working correctly!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if your Render service is running');
    console.log('2. Verify the service URL is correct');
    console.log('3. Check Render logs for errors');
    console.log('4. Ensure MONGODB_URI is set in Render environment variables');
  }
}

// Use fetch if available (Node 18+), otherwise use http/https
if (typeof fetch === 'undefined') {
  global.fetch = async (url) => {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });
      req.on('error', reject);
    });
  };
}

testAPI();