#!/usr/bin/env node
/**
 * Fix AI Assistant - Update the assistant to provide better responses
 * This script updates the assistant engine to provide more engaging responses
 */

const fs = require('fs');
const path = require('path');

const assistantFile = path.join(__dirname, 'apps/api/src/assistant/engine.js');

console.log('🔧 Fixing AI Assistant responses...');

// Read the current file
let content = fs.readFileSync(assistantFile, 'utf8');

// Enhanced chitchat responses
const enhancedChitchat = `    case INTENTS.CHITCHAT:
      // Enhanced chitchat response with more personality
      const greetings = [
        \`Hello! I'm \${config.name}, your \${config.role} at \${config.company}. I'm here to help you with anything related to our store - from finding products to tracking orders. What can I do for you today?\`,
        \`Hi there! Welcome to \${config.company}! I'm \${config.name} and I'm excited to help you with your shopping needs. Whether you're looking for products, checking order status, or have questions about our policies, I'm here to assist!\`,
        \`Hey! Great to meet you! I'm \${config.name}, your personal shopping assistant at \${config.company}. I can help you discover amazing products, track your orders, and answer any questions you might have. How can I make your shopping experience better today?\`
      ];
      response.text = greetings[Math.floor(Math.random() * greetings.length)];
      break;`;

// Enhanced off-topic responses
const enhancedOffTopic = `    case INTENTS.OFF_TOPIC:
      response.text = \`I appreciate your question! While I'm focused on helping with \${config.company} shopping, orders, and policies, I'd be happy to assist you with anything related to our store. Is there something specific about our products or services I can help you with today?\`;
      break;`;

// Enhanced default responses
const enhancedDefault = `    default:
      response.text = \`I'm here to help! I can assist you with:\n\n🛍️ **Product Search** - Find exactly what you're looking for\n📦 **Order Tracking** - Check your order status and delivery\n📋 **Store Policies** - Learn about returns, shipping, and more\n\nWhat would you like to know about \${config.company}?\`;
      break;`;

// Replace the chitchat case
content = content.replace(
  /case INTENTS\.CHITCHAT:[\s\S]*?break;/,
  enhancedChitchat
);

// Replace the off-topic case
content = content.replace(
  /case INTENTS\.OFF_TOPIC:[\s\S]*?break;/,
  enhancedOffTopic
);

// Replace the default case
content = content.replace(
  /default:[\s\S]*?response\.text = `I'm here to help! You can ask me about products, check your order status, or learn about our policies\. What would you like to know\?`;[\s\S]*?break;/,
  enhancedDefault
);

// Add a fallback for when LLM is not available
const llmFallback = `
// Enhanced fallback when LLM is not available
function getEnhancedFallbackResponse(intent, userInput) {
  const responses = {
    [INTENTS.CHITCHAT]: [
      "Hello! I'm Alex, your personal shopping assistant at ahmad store. I'm here to make your shopping experience amazing! What can I help you with today?",
      "Hi there! Welcome to ahmad store! I'm Alex and I'm excited to help you find exactly what you're looking for. How can I assist you today?",
      "Hey! Great to see you here! I'm Alex, your shopping companion at ahmad store. I can help you discover products, track orders, and answer any questions. What brings you here today?"
    ],
    [INTENTS.PRODUCT_SEARCH]: [
      "I'd love to help you find the perfect products! Can you tell me what you're looking for? I can search by name, category, or even just describe what you need.",
      "Great! I'm here to help you discover amazing products. What kind of items are you interested in? I can search our entire catalog for you.",
      "Perfect! Let's find you something great. What products are you looking for? I can help you browse by category or search for specific items."
    ],
    [INTENTS.ORDER_STATUS]: [
      "I can help you track your order! Please provide your order ID (it's usually a long number or code) and I'll check the status for you.",
      "Sure! I'd be happy to check your order status. Just share your order ID with me and I'll get you the latest information.",
      "Absolutely! I can look up your order details. Please provide your order ID and I'll tell you exactly where your order is."
    ],
    [INTENTS.POLICY_QUESTION]: [
      "I can help you with our store policies! What specific policy information are you looking for? I can help with returns, shipping, payments, and more.",
      "Great question! I'm here to explain our policies. Are you asking about returns, shipping, payments, or something else?",
      "I'd be happy to help with policy questions! What would you like to know about our store policies?"
    ]
  };
  
  const intentResponses = responses[intent] || responses[INTENTS.CHITCHAT];
  return intentResponses[Math.floor(Math.random() * intentResponses.length)];
}`;

// Add the fallback function before the main router
content = content.replace(
  /\/\/ Main assistant endpoint/,
  llmFallback + '\n\n// Main assistant endpoint'
);

// Update the callLLM function to use fallback
const enhancedCallLLM = `// Call LLM service (/generate)
async function callLLM(prompt, opts = {}) {
  const base = process.env.LLM_ENDPOINT;
  if (!base) {
    console.log('⚠️ LLM_ENDPOINT not configured, using enhanced fallback');
    return null; // Return null to trigger fallback
  }
  const url = \`\${base.replace(/\\/+$/, '')}/generate\`;
  try {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
        max_tokens: Number(opts.maxTokens || 256),
        temperature: Number(opts.temperature || 0.2)
        })
      });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(\`LLM \${response.status}: \${txt}\`);
    }
    const data = await response.json();
    return (data && (data.text || data.answer || '')) || '';
  } catch (err) {
    console.error('LLM call failed:', err.message || err);
    return null; // Return null to trigger fallback
  }
}`;

content = content.replace(
  /\/\/ Call LLM service.*?^}/ms,
  enhancedCallLLM
);

// Update the generateResponse function to use fallback
const fallbackIntegration = `
    // If LLM is not available, use enhanced fallback
    if (!response.text && !base) {
      response.text = getEnhancedFallbackResponse(intent.intent, userInput);
    }`;

// Add fallback integration to the generateResponse function
content = content.replace(
  /return response;/,
  fallbackIntegration + '\n  \n  return response;'
);

// Write the updated file
fs.writeFileSync(assistantFile, content);

console.log('✅ AI Assistant responses enhanced!');
console.log('📝 The assistant now provides more engaging responses even without LLM');
console.log('🚀 To get full LLM functionality, deploy the LLM service and set LLM_ENDPOINT');