const express = require('express');
const { pool, testConnection } = require('./config/database');

const router = express.Router();

// Test database connection before processing orders
const ensureDBConnection = async () => {
  if (!pool) {
    console.log('❌ No database pool available');
    return false;
  }
  
  try {
    // Test connection with a simple query
    await pool.execute('SELECT 1');
    console.log('✅ Database connection verified for orders');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed for orders:', error.message);
    return false;
  }
};

// Orders
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, items, total, deliveryMethod, address, fullName, wilaya, city, shippingCost, productPrice, discountPercentage } = req.body || {};
    
    console.log('Order creation attempt:', { phoneNumber, items: items?.length, total, deliveryMethod, fullName, wilaya, city });
    console.log('Database pool status:', pool ? 'Available' : 'Not available');
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }
    
    if (!deliveryMethod || !address || !fullName || !wilaya || !city) {
      return res.status(400).json({ error: 'Missing required delivery information' });
    }
    
    if (total === undefined || total === null || isNaN(total)) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }
    
    // Try database operation, fallback to mock if fails
    const dbConnected = await ensureDBConnection();
    
    try {
      if (!dbConnected) {
        console.log('⚠️ No database connection, using mock mode');
        throw new Error('No database connection');
      }
      
      const today = new Date().toISOString().slice(0,10);
      const orderId = `ORD-${Math.floor(Math.random() * 100000)}`;
      
      // Check if customer has orders today
      let existingOrder = null;
      if (phoneNumber) {
        const [existingOrders] = await pool.execute(
          'SELECT * FROM orders WHERE phone = ? AND date = ?',
          [phoneNumber, today]
        );
        
        if (existingOrders.length > 0) {
          existingOrder = existingOrders[0];
        }
      }
      
      if (existingOrder) {
        // Add items to existing order (same-day grouping)
        for (const item of items) {
          await pool.execute(`
            INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image, color, size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [existingOrder.id, item.id || null, item.name || '', item.price || 0, item.quantity || 1, item.image || null, item.color || null, item.size || null]);
        }
        
        // Update order totals
        await pool.execute(
          'UPDATE orders SET total = total + ?, product_price = product_price + ? WHERE id = ?',
          [total, productPrice || 0, existingOrder.id]
        );
        
        return res.json({ 
          success: true, 
          orderId: existingOrder.id,
          order: { ...existingOrder, total: existingOrder.total + total }, 
          message: 'Items added to existing order for today'
        });
      } else {
        // Create new order
        await pool.execute(`
          INSERT INTO orders (id, phone, date, total, status, delivery_method, address, full_name, wilaya, city, shipping_cost, product_price, discount_percentage)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, phoneNumber || null, today, total, 'processing', deliveryMethod, address, fullName, wilaya, city, shippingCost || 0, productPrice || 0, discountPercentage || 0]);
        
        // Add order items
        for (const item of items) {
          await pool.execute(`
            INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image, color, size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [orderId, item.id || null, item.name || '', item.price || 0, item.quantity || 1, item.image || null, item.color || null, item.size || null]);
        }
        
        return res.json({
          success: true,
          orderId,
          message: 'Order created successfully',
          order: {
            id: orderId,
            phoneNumber,
            items,
            total,
            deliveryMethod,
            address,
            fullName,
            wilaya,
            city,
            shippingCost,
            status: 'processing',
            createdAt: new Date().toISOString()
          }
        });
      }
    } catch (dbError) {
      console.log('Database error, using mock mode:', dbError.message);
      
      // Mock order creation for testing without database
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log('Mock order created:', orderId);
      
      return res.json({
        success: true,
        orderId,
        message: 'Order created successfully (mock mode)',
        order: {
          id: orderId,
          phoneNumber,
          items,
          total,
          deliveryMethod,
          address,
          fullName,
          wilaya,
          city,
          shippingCost,
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
});

// Get orders (for admin)
router.get('/', async (req, res) => {
  try {
    if (!pool) {
      return res.json({ orders: [] });
    }
    
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
    res.json({ orders: [] });
  }
});

module.exports = router;
