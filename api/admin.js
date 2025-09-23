const express = require('express');
const { pool } = require('./config/database');

const router = express.Router();

// Simple admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  // For now, we'll use a simple approach
  // In production, you should use proper JWT tokens
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  // Simple check - in production use proper JWT verification
  if (authHeader === 'Bearer admin-token') {
    next();
  } else {
    res.status(401).json({ error: 'Invalid admin token' });
  }
};

// Admin login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Simple hardcoded admin credentials - replace with database lookup
  if (username === 'admin' && password === 'admin123') {
    res.json({ 
      success: true, 
      token: 'admin-token',
      user: { username: 'admin', role: 'admin' }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get all orders (admin)
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT o.*, 
             GROUP_CONCAT(
               CONCAT(oi.product_name, ' (', oi.quantity, 'x)')
               SEPARATOR ', '
             ) as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `);

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get all promotions (admin)
router.get('/promotions', async (req, res) => {
  try {
    const [promotions] = await pool.execute(`
      SELECT p.*, a.name as customer_name 
      FROM promotions p 
      LEFT JOIN accounts a ON p.phone = a.phone 
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    res.json({ promotions });
  } catch (error) {
    console.error('Get all promotions error:', error);
    res.status(500).json({ error: 'Failed to get promotions' });
  }
});

// Get admin stats
router.get('/stats', async (req, res) => {
  try {
    // Get order stats
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
      FROM orders
    `);

    // Get customer stats
    const [customerStats] = await pool.execute(`
      SELECT COUNT(*) as total_customers FROM accounts
    `);

    // Get promotion stats
    const [promotionStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_promotions,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_promotions
      FROM promotions
    `);
    
    res.json({
      orders: orderStats[0],
      customers: customerStats[0],
      promotions: promotionStats[0]
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
