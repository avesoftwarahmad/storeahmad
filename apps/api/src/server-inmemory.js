/**
 * Demo Server with In-Memory Database
 * للاختبار السريع بدون MongoDB
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// In-Memory Database
const db = {
  customers: [
    { _id: '1', name: 'Demo User', email: 'demouser@example.com', phone: '+1234567890', address: '123 Main St' },
    { _id: '2', name: 'John Doe', email: 'john@example.com', phone: '+9876543210', address: '456 Park Ave' }
  ],
  products: [
    { _id: '1', name: 'Laptop', price: 999, category: 'Electronics', stock: 10, imageUrl: '/laptop.jpg' },
    { _id: '2', name: 'Phone', price: 699, category: 'Electronics', stock: 25, imageUrl: '/phone.jpg' },
    { _id: '3', name: 'Shirt', price: 29, category: 'Clothing', stock: 100, imageUrl: '/shirt.jpg' }
  ],
  orders: [
    { 
      _id: '1', 
      customerId: '1', 
      items: [{ productId: '1', name: 'Laptop', price: 999, quantity: 1 }],
      total: 999,
      status: 'PENDING',
      createdAt: new Date()
    }
  ]
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Demo server running (in-memory database)' });
});

// Customers
app.get('/api/customers', (req, res) => {
  const { email } = req.query;
  if (email) {
    const customer = db.customers.find(c => c.email === email);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    return res.json(customer);
  }
  res.json(db.customers);
});

app.get('/api/customers/:id', (req, res) => {
  const customer = db.customers.find(c => c._id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// Products
app.get('/api/products', (req, res) => {
  res.json(db.products);
});

app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p._id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Orders
app.get('/api/orders', (req, res) => {
  const { customerId } = req.query;
  if (customerId) {
    const orders = db.orders.filter(o => o.customerId === customerId);
    return res.json(orders);
  }
  res.json(db.orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.orders.find(o => o._id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    _id: String(db.orders.length + 1),
    ...req.body,
    status: 'PENDING',
    createdAt: new Date()
  };
  db.orders.push(newOrder);
  res.status(201).json(newOrder);
});

// SSE for order tracking
app.get('/api/orders/:id/stream', (req, res) => {
  const order = db.orders.find(o => o._id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  let currentIndex = statuses.indexOf(order.status);

  // Send current status
  res.write(`data: ${JSON.stringify({ status: order.status, timestamp: new Date() })}\n\n`);

  // Auto-progress status
  const interval = setInterval(() => {
    if (currentIndex < statuses.length - 1) {
      currentIndex++;
      order.status = statuses[currentIndex];
      res.write(`data: ${JSON.stringify({ status: order.status, timestamp: new Date() })}\n\n`);
      
      if (order.status === 'DELIVERED') {
        clearInterval(interval);
        res.end();
      }
    }
  }, 3000); // Progress every 3 seconds

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Analytics (simple)
app.get('/api/analytics/daily-revenue', (req, res) => {
  const revenue = db.orders.reduce((sum, order) => sum + order.total, 0);
  res.json([{
    date: new Date().toISOString().split('T')[0],
    revenue,
    orderCount: db.orders.length
  }]);
});

// Dashboard metrics
app.get('/api/dashboard/business-metrics', (req, res) => {
  const totalRevenue = db.orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = totalRevenue / db.orders.length || 0;
  
  res.json({
    totalRevenue,
    totalOrders: db.orders.length,
    avgOrderValue,
    totalCustomers: db.customers.length,
    totalProducts: db.products.length
  });
});

// Additional analytics endpoints for admin dashboard
app.get('/api/analytics/dashboard-metrics', (req, res) => {
  const totalRevenue = db.orders.reduce((sum, order) => sum + order.total, 0);
  res.json({
    totalRevenue,
    totalOrders: db.orders.length,
    totalCustomers: db.customers.length,
    averageOrderValue: totalRevenue / db.orders.length || 0,
    recentOrders: db.orders.slice(-5),
    topProducts: db.products.slice(0, 5)
  });
});

app.get('/api/dashboard/performance', (req, res) => {
  res.json({
    apiLatency: 45,
    sseConnections: 2,
    llmResponseTime: 250,
    failedRequests: 0
  });
});

app.get('/api/dashboard/assistant-stats', (req, res) => {
  res.json({
    totalQueries: 127,
    intentsDistribution: {
      order_status: 45,
      policy_question: 32,
      product_search: 28,
      general: 22
    },
    functionCalls: 89,
    avgResponseTime: 280
  });
});

// Import assistant modules
const { classifyIntent, INTENTS } = require('./assistant/intent-classifier');
const functionRegistry = require('./assistant/function-registry');
const citationValidator = require('./assistant/citation-validator');

// Load configuration
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

let assistantConfig = null;
let knowledgeBase = null;

// Load YAML configuration
function loadConfig() {
  try {
    const yamlPath = path.join(__dirname, '../../../docs/prompts.yaml');
    if (fs.existsSync(yamlPath)) {
      const yamlContent = fs.readFileSync(yamlPath, 'utf8');
      assistantConfig = yaml.load(yamlContent);
      console.log('✅ Assistant configuration loaded');
    } else {
      console.warn('⚠️ prompts.yaml not found, using defaults');
      assistantConfig = {
        identity: {
          name: 'Alex',
          role: 'Customer Support Specialist',
          company: 'ShopSmart',
          personality: ['helpful', 'professional', 'friendly', 'efficient']
        }
      };
    }
  } catch (error) {
    console.error('Error loading prompts.yaml:', error);
    assistantConfig = {
      identity: {
        name: 'Alex',
        role: 'Customer Support Specialist',
        company: 'ShopSmart',
        personality: ['helpful', 'professional', 'friendly', 'efficient']
      }
    };
  }
}

// Load knowledge base
function loadKnowledgeBase() {
  try {
    const kbPath = path.join(__dirname, '../../../docs/ground-truth.json');
    if (fs.existsSync(kbPath)) {
      const kbContent = fs.readFileSync(kbPath, 'utf8');
      knowledgeBase = JSON.parse(kbContent);
      console.log(`✅ Knowledge base loaded: ${knowledgeBase.length} policies`);
    } else {
      console.warn('⚠️ ground-truth.json not found');
      knowledgeBase = [];
    }
  } catch (error) {
    console.error('Error loading ground-truth.json:', error);
    knowledgeBase = [];
  }
}

// Call LLM service (/generate)
async function callLLM(prompt, opts = {}) {
  const base = process.env.LLM_ENDPOINT;
  if (!base || base === 'https://your-ngrok-url.ngrok.io') {
    // Mock LLM response for testing
    return `I understand you're asking about: ${prompt.split('\n').pop()}. This is a mock response since the LLM endpoint is not configured. Please set your ngrok URL in the LLM_ENDPOINT environment variable.`;
  }
  
  const url = `${base.replace(/\/+$/, '')}/generate`;
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
      throw new Error(`LLM ${response.status}: ${txt}`);
    }
    const data = await response.json();
    return (data && (data.text || data.answer || '')) || '';
  } catch (err) {
    console.error('LLM call failed:', err.message || err);
    return `I apologize, but I'm having trouble connecting to our AI service right now. Please try again later.`;
  }
}

// Handle policy questions with knowledge base
async function handlePolicyQuestion(query) {
  // Find relevant policies from knowledge base
  const relevantPolicies = citationValidator.findRelevantPolicies(query);
  
  if (relevantPolicies.length === 0) {
    return "I could not find this information in the ShopSmart documentation.";
  }

  // Build grounded prompt for LLM requiring citations
  const identity = assistantConfig?.identity || { name: 'Alex', role: 'Support', company: 'ShopSmart' };
  const system = [
    `You are ${identity.name}, a ${identity.role} at ${identity.company}.`,
    'Answer ONLY using the provided policy snippets.',
    'When you reference policy info, you MUST cite at least one [PolicyID] from the provided context.',
    'Be concise and helpful. Never mention being an AI or model.'
  ].join('\n');

  const contextLines = relevantPolicies.map(p => `- [${p.id}] ${p.answer}`);
  const contextBlock = contextLines.join('\n');
  const prompt = [
    system,
    '',
    'Context:',
    contextBlock,
    '',
    `User question: ${query}`,
    '',
    'Answer (include [PolicyID] citations from Context):'
  ].join('\n');

  const llmText = await callLLM(prompt);

  // Ensure at least one citation exists
  const citations = citationValidator.extractCitations(llmText || '');
  let finalText = llmText || '';
  if (!citations || citations.length === 0) {
    finalText = `${finalText ? finalText + ' ' : ''}[${relevantPolicies[0].id}]`;
  }
  return finalText.trim();
}

// Handle order status queries
async function handleOrderStatus(query) {
  // Extract order ID from query
  const orderIdPattern = /\b(\d{10,}|[a-f0-9]{24})\b/i;
  const match = query.match(orderIdPattern);
  
  if (!match) {
    return "I'd be happy to check your order status. Please provide your order ID (it should be a long number or code).";
  }
  
  const orderId = match[1];
  
  // Execute function to get order status
  const result = await functionRegistry.execute('getOrderStatus', { orderId });
  
  if (result.success) {
    const order = result.result;
    return `📦 **Order Status Update**\n\n` +
           `Order ID: ${order.orderId}\n` +
           `Status: **${order.status}**\n` +
           `Customer: ${order.customerName}\n` +
           `Total: $${order.total}\n` +
           `Carrier: ${order.carrier || 'Standard Shipping'}\n` +
           `Estimated Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}\n\n` +
           `Your order is being processed and you'll receive updates as it progresses.`;
  } else {
    return `I couldn't find an order with ID: ${orderId}. Please double-check the order ID or contact our support team.`;
  }
}

// Generate response based on intent
async function generateResponse(userInput, intent, functionResults = []) {
  const config = assistantConfig.identity;
  
  let response = {
    text: '',
    intent: intent.intent,
    confidence: intent.confidence,
    functionsExecuted: [],
    citations: [],
    citationValidation: null
  };
  
  switch (intent.intent) {
    case INTENTS.POLICY_QUESTION:
      const policyResponse = await handlePolicyQuestion(userInput);
      response.text = policyResponse;
      
      // Validate citations
      const validation = citationValidator.validateResponse(policyResponse);
      response.citations = validation.extractedCitations || [];
      response.citationValidation = validation;
      break;
      
    case INTENTS.ORDER_STATUS:
      const orderResponse = await handleOrderStatus(userInput);
      response.text = orderResponse;
      response.functionsExecuted.push('getOrderStatus');
      break;
      
    case INTENTS.PRODUCT_SEARCH:
      if (functionResults.length > 0 && functionResults[0].success) {
        const result = functionResults[0].result;
        if (result.products.length > 0) {
          const identity = assistantConfig?.identity || { name: 'Alex', role: 'Support', company: 'ShopSmart' };
          const list = result.products.slice(0, 5).map(p => `- ${p.name} ($${p.price}) | ${p.category} | stock: ${p.stock}`).join('\n');
          const prompt = [
            `${identity.name} is a ${identity.role} at ${identity.company}. Write a concise helpful summary of top matching products for the customer.`,
            'Do not invent details. Use exactly the provided list. Keep under 120 words.',
            '',
            'Products:',
            list,
            '',
            'Answer:'
          ].join('\n');
          const llmText = await callLLM(prompt);
          response.text = (llmText || '').trim() || `Found ${result.count} matching products. Would you like more details about any of them?`;
        } else {
          response.text = `I couldn't find any products matching your search. Try using different keywords or browse our categories for more options.`;
        }
      } else {
        response.text = `I can help you find products! What are you looking for today? You can search by product name, category, or describe what you need.`;
      }
      break;
      
    case INTENTS.COMPLAINT:
      response.text = `I'm really sorry for the trouble you're experiencing. Your satisfaction is very important to us and I want to make this right.\n\n` +
        `Could you share more details about the issue? If it's about an order, please include the order ID so I can investigate immediately.`;
      break;
      
    case INTENTS.CHITCHAT:
      response.text = `Hello! I'm ${config.name}, your ${config.role} at ${config.company}. I can help with products, orders, and policies. How can I assist you today?`;
      break;
      
    case INTENTS.OFF_TOPIC:
      response.text = `I appreciate your question, but I'm focused on ${config.company} shopping, orders, and policies. Is there anything related to our store I can help you with today?`;
      break;
      
    case INTENTS.VIOLATION:
      response.text = `I understand you may be frustrated, but I need to maintain a professional conversation. I'm here to help with your ${config.company} needs. Please let me know how I can assist with your shopping or order concerns.`;
      break;
      
    default:
      response.text = `I'm here to help! You can ask me about products, check your order status, or learn about our policies. What would you like to know?`;
  }
  
  return response;
}

// Assistant endpoint
app.post('/api/assistant/chat', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, context = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: {
          code: 'MISSING_MESSAGE',
          message: 'Message is required'
        }
      });
    }
    
    // Classify intent
    const intent = classifyIntent(message);
    console.log(`Intent classified: ${intent.intent} (confidence: ${intent.confidence})`);
    
    // Prepare to track function calls
    const functionsCalled = [];
    const functionResults = [];
    
    // Execute functions based on intent (max 2 function calls)
    if (intent.intent === INTENTS.ORDER_STATUS) {
      // Extract order ID from message
      const orderIdMatch = message.match(/[0-9a-f]{24}/i);
      if (orderIdMatch) {
        const result = await functionRegistry.execute('getOrderStatus', {
          orderId: orderIdMatch[0]
        });
        functionsCalled.push('getOrderStatus');
        functionResults.push(result);
      }
    } else if (intent.intent === INTENTS.PRODUCT_SEARCH) {
      // Extract search query
      const searchMatch = message.match(/(?:looking for|search|find|show me)\s+(.+)/i);
      console.log('Product search match:', searchMatch);
      if (searchMatch) {
        console.log('Executing searchProducts with query:', searchMatch[1]);
        try {
          const result = await functionRegistry.execute('searchProducts', {
            query: searchMatch[1],
            limit: 5
          });
          console.log('Search result:', result);
          functionsCalled.push('searchProducts');
          functionResults.push(result);
        } catch (error) {
          console.error('Function execution error:', error);
        }
      }
    }
    
    // Generate response
    const response = await generateResponse(message, intent, functionResults);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    res.json({
      response: response.text,
      intent: response.intent,
      confidence: response.confidence,
      functionsExecuted: response.functionsExecuted,
      citations: response.citations,
      citationValidation: response.citationValidation,
      responseTime,
      assistant: {
        name: assistantConfig.identity.name,
        role: assistantConfig.identity.role
      }
    });
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({
      error: {
        code: 'ASSISTANT_ERROR',
        message: 'Failed to process your request'
      }
    });
  }
});

// Get assistant information
app.get('/api/assistant/info', (req, res) => {
  res.json({
    identity: assistantConfig.identity,
    supportedIntents: Object.keys(INTENTS).map(k => ({
      name: INTENTS[k],
      description: 'Intent description'
    })),
    availableFunctions: functionRegistry.getAllSchemas().map(s => ({
      name: s.name,
      description: s.description
    })),
    knowledgeBaseSize: knowledgeBase.length
  });
});

// Initialize configuration
loadConfig();
loadKnowledgeBase();

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 DEMO SERVER RUNNING!            ║
║                                        ║
║     http://localhost:${PORT}           ║
║                                        ║
║     Using In-Memory Database           ║
║     (No MongoDB Required)              ║
║                                        ║
║     Test User: demouser@example.com   ║
║     Assistant: ${assistantConfig?.identity?.name || 'Alex'}                    ║
╚════════════════════════════════════════╝
  `);
});
