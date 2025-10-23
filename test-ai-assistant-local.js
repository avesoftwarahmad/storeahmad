#!/usr/bin/env node

/**
 * Test AI Assistant Locally (without MongoDB)
 * This tests the assistant functionality without requiring a database connection
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Mock the database connection
const mockDB = {
  connectDB: async () => {
    console.log('✅ Mock database connected');
    return { collection: () => ({ find: () => ({ toArray: () => [] }) }) };
  },
  getDB: () => ({ collection: () => ({ find: () => ({ toArray: () => [] }) }) }),
  closeDB: () => console.log('✅ Mock database closed')
};

// Mock the seed function
const mockSeed = {
  autoSeedIfEmpty: async () => {
    console.log('✅ Mock seeding completed');
  }
};

// Override the database module
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === './db') return mockDB;
  if (id === './seed-once') return mockSeed;
  return originalRequire.apply(this, arguments);
};

// Now require the server
const app = require('./apps/api/src/server.js');

// Test the assistant endpoints
async function testAssistant() {
  console.log('🧪 Testing AI Assistant Locally...\n');
  
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
    try {
      console.log(`📝 Testing: ${testCase.name}`);
      console.log(`   Message: "${testCase.message}"`);
      
      const response = await fetch('http://localhost:3001/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testCase.message,
          context: {}
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success (${response.status})`);
        console.log(`   📄 Intent: ${data.intent}`);
        console.log(`   📄 Response: ${data.response.substring(0, 100)}...`);
        console.log(`   📄 Functions: ${data.functionsExecuted?.join(', ') || 'none'}`);
      } else {
        const error = await response.text();
        console.log(`   ❌ Failed (${response.status}): ${error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  // Test assistant info
  try {
    console.log('📝 Testing: Assistant Info');
    const response = await fetch('http://localhost:3001/api/assistant/info');
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success - Assistant: ${data.identity.name} (${data.identity.role})`);
      console.log(`   📄 Supported Intents: ${data.supportedIntents.length}`);
      console.log(`   📄 Knowledge Base: ${data.knowledgeBaseSize} policies`);
    } else {
      console.log(`   ❌ Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n🎉 Local testing complete!');
  console.log('💡 If all tests passed, your AI assistant is ready for Render deployment.');
}

// Wait for server to start, then run tests
setTimeout(() => {
  testAssistant().catch(console.error);
}, 2000);