#!/usr/bin/env node

/**
 * Test script for AI Assistant
 * This tests both the RAG-based and LLM-based responses
 */

// Use built-in fetch (Node.js 18+) or require node-fetch for older versions
let fetch;
try {
  fetch = globalThis.fetch;
} catch (e) {
  try {
    fetch = require('node-fetch');
  } catch (e2) {
    console.error('No fetch available. Please install node-fetch or use Node.js 18+');
    process.exit(1);
  }
}

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

async function testAssistant() {
  console.log('🧪 Testing AI Assistant...\n');
  
  const testCases = [
    {
      name: 'Greeting/Chitchat',
      message: 'Hello! How are you?',
      expectedIntent: 'chitchat'
    },
    {
      name: 'Product Search',
      message: 'I am looking for laptops',
      expectedIntent: 'product_search'
    },
    {
      name: 'Order Status',
      message: 'What is the status of order 507f1f77bcf86cd799439011?',
      expectedIntent: 'order_status'
    },
    {
      name: 'Policy Question',
      message: 'What is your return policy?',
      expectedIntent: 'policy_question'
    },
    {
      name: 'Complaint',
      message: 'I am very unhappy with my recent order',
      expectedIntent: 'complaint'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);
    
    try {
      const response = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          context: {}
        })
      });

      if (!response.ok) {
        console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      
      console.log(`   ✅ Response: "${data.response}"`);
      console.log(`   🎯 Intent: ${data.intent} (confidence: ${data.confidence})`);
      console.log(`   ⏱️  Response Time: ${data.responseTime}ms`);
      
      if (data.functionsExecuted && data.functionsExecuted.length > 0) {
        console.log(`   🔧 Functions: ${data.functionsExecuted.join(', ')}`);
      }
      
      if (data.citations && data.citations.length > 0) {
        console.log(`   📚 Citations: ${data.citations.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  // Test assistant info endpoint
  console.log('📊 Assistant Info:');
  try {
    const response = await fetch(`${API_BASE}/api/assistant/info`);
    const info = await response.json();
    console.log(`   Name: ${info.identity.name}`);
    console.log(`   Role: ${info.identity.role}`);
    console.log(`   Knowledge Base: ${info.knowledgeBaseSize} policies`);
    console.log(`   Supported Intents: ${info.supportedIntents.length}`);
  } catch (error) {
    console.log(`   ❌ Error getting info: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testAssistant().catch(console.error);
}

module.exports = { testAssistant };