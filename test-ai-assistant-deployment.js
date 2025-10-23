#!/usr/bin/env node

/**
 * Test AI Assistant Deployment
 * Run this after deploying to Render to verify everything works
 */

const https = require('https');
const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

async function testEndpoint(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = (url.startsWith('https') ? https : http).request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing AI Assistant Deployment...\n');
  
  const tests = [
    {
      name: 'Health Check',
      test: () => testEndpoint(`${API_BASE}/api/health`)
    },
    {
      name: 'Assistant Info',
      test: () => testEndpoint(`${API_BASE}/api/assistant/info`)
    },
    {
      name: 'Greeting Message',
      test: () => testEndpoint(`${API_BASE}/api/assistant/chat`, 'POST', {
        message: 'Hello! How are you?',
        context: {}
      })
    },
    {
      name: 'Product Search',
      test: () => testEndpoint(`${API_BASE}/api/assistant/chat`, 'POST', {
        message: 'I am looking for laptops',
        context: {}
      })
    },
    {
      name: 'Order Status',
      test: () => testEndpoint(`${API_BASE}/api/assistant/chat`, 'POST', {
        message: 'What is the status of order 507f1f77bcf86cd799439011?',
        context: {}
      })
    },
    {
      name: 'Policy Question',
      test: () => testEndpoint(`${API_BASE}/api/assistant/chat`, 'POST', {
        message: 'What is your return policy?',
        context: {}
      })
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📝 Testing: ${test.name}`);
      const result = await test.test();
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`   ✅ Success (${result.status})`);
        if (test.name === 'Greeting Message' && result.data.response) {
          console.log(`   📄 Response: ${result.data.response.substring(0, 100)}...`);
        }
        passed++;
      } else {
        console.log(`   ❌ Failed (${result.status}): ${JSON.stringify(result.data)}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your AI assistant is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the deployment logs for issues.');
  }
}

runTests().catch(console.error);
