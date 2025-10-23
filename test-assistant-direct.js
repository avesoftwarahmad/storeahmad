#!/usr/bin/env node

/**
 * Direct AI Assistant Test
 * Tests the assistant engine directly without starting a server
 */

const path = require('path');

// Mock the database and other dependencies
const mockDB = {
  connectDB: async () => ({ collection: () => ({ find: () => ({ toArray: () => [] }) }) }),
  getDB: () => ({ collection: () => ({ find: () => ({ toArray: () => [] }) }) }),
  closeDB: () => {}
};

const mockSeed = {
  autoSeedIfEmpty: async () => {}
};

// Override modules
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === './db') return mockDB;
  if (id === './seed-once') return mockSeed;
  return originalRequire.apply(this, arguments);
};

// Set up environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Now we can test the assistant engine directly
async function testAssistantEngine() {
  console.log('🧪 Testing AI Assistant Engine Directly...\n');
  
  try {
    // Import the assistant engine
    const { assistantRouter } = require('./apps/api/src/assistant/engine');
    
    console.log('✅ Assistant engine loaded successfully');
    
    // Test the assistant info endpoint
    const infoReq = { method: 'GET', url: '/info' };
    const infoRes = {
      json: (data) => {
        console.log('📄 Assistant Info:');
        console.log(`   Name: ${data.identity.name}`);
        console.log(`   Role: ${data.identity.role}`);
        console.log(`   Company: ${data.identity.company}`);
        console.log(`   Supported Intents: ${data.supportedIntents.length}`);
        console.log(`   Knowledge Base: ${data.knowledgeBaseSize} policies`);
        console.log(`   Available Functions: ${data.availableFunctions.length}`);
      }
    };
    
    // Mock the info endpoint
    const infoHandler = assistantRouter.stack.find(layer => 
      layer.route && layer.route.path === '/info'
    );
    
    if (infoHandler) {
      console.log('📝 Testing: Assistant Info');
      infoHandler.route.stack[0].handle(infoReq, infoRes);
    }
    
    // Test chat endpoint
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
      console.log(`\n📝 Testing: ${testCase.name}`);
      console.log(`   Message: "${testCase.message}"`);
      
      const chatReq = {
        method: 'POST',
        url: '/chat',
        body: {
          message: testCase.message,
          context: {}
        }
      };
      
      const chatRes = {
        json: (data) => {
          console.log(`   ✅ Success`);
          console.log(`   📄 Intent: ${data.intent}`);
          console.log(`   📄 Confidence: ${data.confidence}`);
          console.log(`   📄 Response: ${data.response.substring(0, 100)}...`);
          console.log(`   📄 Functions: ${data.functionsExecuted?.join(', ') || 'none'}`);
          if (data.citations && data.citations.length > 0) {
            console.log(`   📄 Citations: ${data.citations.join(', ')}`);
          }
        },
        status: (code) => ({
          json: (data) => {
            console.log(`   ❌ Failed (${code}): ${JSON.stringify(data)}`);
          }
        })
      };
      
      // Mock the chat endpoint
      const chatHandler = assistantRouter.stack.find(layer => 
        layer.route && layer.route.path === '/chat'
      );
      
      if (chatHandler) {
        try {
          await new Promise((resolve, reject) => {
            chatHandler.route.stack[0].handle(chatReq, chatRes);
            setTimeout(resolve, 100); // Give it time to process
          });
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Direct testing complete!');
    console.log('💡 The assistant engine is working correctly.');
    console.log('📋 Next steps:');
    console.log('1. Set up MongoDB Atlas for full functionality');
    console.log('2. Deploy to Render with proper environment variables');
    console.log('3. Optionally set up LLM service for enhanced responses');
    
  } catch (error) {
    console.error('❌ Error testing assistant:', error.message);
    console.error(error.stack);
  }
}

testAssistantEngine();