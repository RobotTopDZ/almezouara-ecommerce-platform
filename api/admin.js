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
  
  // Admin credentials
  const validCredentials = [
    { username: 'robottopdz', password: 'Osamu13579*+-/' },
    { username: 'admin', password: 'admin123' } // Fallback
  ];
  
  const isValidCredentials = validCredentials.some(
    cred => cred.username === username && cred.password === password
  );
  
  if (isValidCredentials) {
    res.json({ 
      success: true, 
      token: 'admin-token',
      user: { username, role: 'admin' }
    });
  } else {
    console.log('Login attempt failed:', { username, password: '***' });
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

// Create promotion (admin)
router.post('/promotions', async (req, res) => {
  try {
    const { phoneNumber, percentage, description, usageLimit = 1 } = req.body;
    
    console.log('Admin promotion creation:', { phoneNumber, percentage, description, usageLimit });
    
    // Validate required fields
    if (!phoneNumber || !percentage) {
      return res.status(400).json({ error: 'Phone number and percentage are required' });
    }
    
    // Ensure account exists
    const [existingAccount] = await pool.execute(
      'SELECT phone FROM accounts WHERE phone = ?',
      [phoneNumber]
    );
    
    if (existingAccount.length === 0) {
      await pool.execute(
        'INSERT INTO accounts (phone, name, password) VALUES (?, ?, ?)',
        [phoneNumber, 'Customer', 'default123']
      );
    }
    
    // Create promotion
    const promotionId = `PROMO-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    await pool.execute(
      'INSERT INTO promotions (id, phone, percentage, description, usage_limit, usage_count, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [promotionId, phoneNumber, percentage, description || '', usageLimit, 0, true]
    );
    
    res.json({
      success: true,
      promotionId,
      message: 'Promotion created successfully',
      promotion: {
        id: promotionId,
        phoneNumber,
        percentage,
        description: description || '',
        usageLimit,
        usageCount: 0,
        isActive: true
      }
    });
    
  } catch (error) {
    console.error('Admin create promotion error:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

// Get admin stats
router.get('/stats', async (req, res) => {
  try {
    // Check if database is available
    if (!pool) {
      // Return mock stats if no database
      return res.json({
        totalOrders: 0,
        totalRevenue: 0,
        totalProducts: 3,
        totalCustomers: 0,
        processingOrders: 0,
        deliveredOrders: 0,
        activePromotions: 0
      });
    }

    // Get order stats
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
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
      totalOrders: orderStats[0].total_orders,
      totalRevenue: orderStats[0].total_revenue,
      totalProducts: 3, // Mock value
      totalCustomers: customerStats[0].total_customers,
      processingOrders: orderStats[0].processing_orders,
      deliveredOrders: orderStats[0].delivered_orders,
      activePromotions: promotionStats[0].active_promotions
    });
  } catch (error) {
    console.error('Get stats error:', error);
    // Return mock stats on error
    res.json({
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 3,
      totalCustomers: 0,
      processingOrders: 0,
      deliveredOrders: 0,
      activePromotions: 0
    });
  }
});

module.exports = router;
