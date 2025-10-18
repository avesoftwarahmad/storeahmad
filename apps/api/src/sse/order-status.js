const { ObjectId } = require('mongodb');
const { getDB } = require('../db');

// Track active SSE connections
const activeConnections = new Map();

// Order status progression with timing
const STATUS_PROGRESSION = [
  { status: 'PENDING', duration: 3000 },     // 3 seconds
  { status: 'PROCESSING', duration: 5000 },  // 5 seconds
  { status: 'SHIPPED', duration: 5000 },     // 5 seconds
  { status: 'DELIVERED', duration: 0 }       // Terminal state
];

// SSE helper to send events
function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Update order status in database
async function updateOrderStatus(orderId, newStatus) {
  const db = getDB();
  
  const result = await db.collection('orders').findOneAndUpdate(
    { _id: new ObjectId(orderId) },
    {
      $set: {
        status: newStatus,
        updatedAt: new Date()
      },
      $push: {
        statusHistory: {
          status: newStatus,
          timestamp: new Date()
        }
      }
    },
    { returnDocument: 'after' }
  );
  
  return result;
}

// Main SSE endpoint handler
async function streamOrderStatus(req, res) {
  const { id } = req.params;
  
  // Validate order ID
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: 'Invalid order ID format'
      }
    });
  }
  
  try {
    const db = getDB();
    
    // Fetch the order
    const order = await db.collection('orders').findOne({
      _id: new ObjectId(id)
    });
    
    if (!order) {
      return res.status(404).json({
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial status immediately
    sendSSE(res, {
      type: 'status',
      orderId: id,
      status: order.status,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      timestamp: new Date()
    });
    
    // If order is already delivered, close connection
    if (order.status === 'DELIVERED') {
      sendSSE(res, {
        type: 'complete',
        message: 'Order has been delivered'
      });
      res.end();
      return;
    }
    
    // Track this connection
    const connectionId = `${id}-${Date.now()}`;
    activeConnections.set(connectionId, { orderId: id, res });
    
    // Find current status index
    let currentStatusIndex = STATUS_PROGRESSION.findIndex(
      s => s.status === order.status
    );
    
    if (currentStatusIndex === -1) {
      currentStatusIndex = 0;
    }
    
    // Function to progress to next status
    const progressStatus = async () => {
      currentStatusIndex++;
      
      if (currentStatusIndex >= STATUS_PROGRESSION.length) {
        // Should not happen, but handle gracefully
        res.end();
        activeConnections.delete(connectionId);
        return;
      }
      
      const nextStatus = STATUS_PROGRESSION[currentStatusIndex];
      
      try {
        // Update database
        const updatedOrder = await updateOrderStatus(id, nextStatus.status);
        
        if (updatedOrder) {
          // Send SSE event
          sendSSE(res, {
            type: 'status',
            orderId: id,
            status: nextStatus.status,
            carrier: updatedOrder.carrier,
            estimatedDelivery: updatedOrder.estimatedDelivery,
            timestamp: new Date()
          });
          
          console.log(`Order ${id} progressed to ${nextStatus.status}`);
          
          // If delivered, close connection
          if (nextStatus.status === 'DELIVERED') {
            sendSSE(res, {
              type: 'complete',
              message: 'Order has been delivered'
            });
            res.end();
            activeConnections.delete(connectionId);
            clearInterval(progressInterval);
            return;
          }
        }
      } catch (error) {
        console.error('Error updating order status:', error);
        sendSSE(res, {
          type: 'error',
          message: 'Failed to update order status'
        });
      }
    };
    
    // Set up auto-progression interval
    const progressInterval = setInterval(() => {
      const currentStatus = STATUS_PROGRESSION[currentStatusIndex];
      if (currentStatus && currentStatus.duration > 0) {
        progressStatus();
      }
    }, STATUS_PROGRESSION[currentStatusIndex].duration || 5000);
    
    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(':heartbeat\n\n');
      } catch (error) {
        // Connection closed, clean up
        clearInterval(heartbeatInterval);
        clearInterval(progressInterval);
        activeConnections.delete(connectionId);
      }
    }, 30000);
    
    // Handle client disconnect
    req.on('close', () => {
      console.log(`SSE connection closed for order ${id}`);
      clearInterval(progressInterval);
      clearInterval(heartbeatInterval);
      activeConnections.delete(connectionId);
      res.end();
    });
    
  } catch (error) {
    console.error('SSE stream error:', error);
    res.status(500).json({
      error: {
        code: 'STREAM_ERROR',
        message: 'Failed to establish SSE stream'
      }
    });
  }
}

// Get count of active connections
function getActiveConnections() {
  return activeConnections.size;
}

// Close all connections (for graceful shutdown)
function closeAllConnections() {
  activeConnections.forEach((connection) => {
    try {
      connection.res.end();
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  });
  activeConnections.clear();
}

module.exports = {
  streamOrderStatus,
  getActiveConnections,
  closeAllConnections
};
