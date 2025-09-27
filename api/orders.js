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
    
    // Try database operation - NO MOCK MODE - FAIL IF DB FAILS
    const dbConnected = await ensureDBConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed - CANNOT CREATE ORDER');
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: 'Cannot process order at this time'
      });
    }
    
    try {
      const today = new Date().toISOString().slice(0,10);
      const orderId = `ORD-${Math.floor(Math.random() * 100000)}`;
      
      // Check if customer has orders today (simplified)
      let existingOrder = null;
      if (phoneNumber) {
        try {
          const [existingOrders] = await pool.execute(
            'SELECT * FROM orders WHERE phone = ? AND DATE(created_at) = CURDATE()',
            [phoneNumber]
          );
          
          if (existingOrders.length > 0) {
            existingOrder = existingOrders[0];
          }
        } catch (error) {
          console.log('⚠️ Error checking existing orders, creating new one');
        }
      }
      
      if (existingOrder) {
        // Add items to existing order (use order_items table)
        for (const item of items) {
          await pool.execute(`
            INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image, color, size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [existingOrder.id, item.id || null, item.name || '', item.price || 0, item.quantity || 1, item.image || null, item.color || null, item.size || null]);
        }
        
        // Update order totals
        await pool.execute(
          'UPDATE orders SET total = total + ? WHERE id = ?',
          [total, existingOrder.id]
        );
        
        return res.json({ 
          success: true, 
          orderId: existingOrder.id,
          order: { ...existingOrder, total: existingOrder.total + total }, 
          message: 'Items added to existing order for today'
        });
      } else {
        // Create new order - adapt to schema differences between environments
        // Detect optional columns that can be NOT NULL in production schema
        let hasDateColumn = false;
        let hasShippingCostColumn = false;
        let hasProductPriceColumn = false;

        try {
          const [dateCol] = await pool.execute("SHOW COLUMNS FROM orders LIKE 'date'");
          hasDateColumn = Array.isArray(dateCol) && dateCol.length > 0;
        } catch (_) {}

        try {
          const [shipCol] = await pool.execute("SHOW COLUMNS FROM orders LIKE 'shipping_cost'");
          hasShippingCostColumn = Array.isArray(shipCol) && shipCol.length > 0;
        } catch (_) {}

        try {
          const [prodCol] = await pool.execute("SHOW COLUMNS FROM orders LIKE 'product_price'");
          hasProductPriceColumn = Array.isArray(prodCol) && prodCol.length > 0;
        } catch (_) {}

        // Normalize monetary values
        const totalNum = Number(total) || 0;
        let shippingNum = Number.isFinite(Number(shippingCost)) ? Number(shippingCost) : null;
        let productNum = Number.isFinite(Number(productPrice)) ? Number(productPrice) : null;

        if (shippingNum === null && productNum !== null) {
          shippingNum = Math.max(0, totalNum - productNum);
        }
        if (productNum === null && shippingNum !== null) {
          productNum = Math.max(0, totalNum - shippingNum);
        }
        if (shippingNum === null && productNum === null) {
          // Safe defaults if frontend didn't provide detailed split
          shippingNum = 0;
          productNum = totalNum;
        }

        // Build columns/values dynamically
        const cols = ['id', 'phone'];
        const vals = [orderId, phoneNumber || null];

        if (hasDateColumn) {
          cols.push('date');
          vals.push(today);
        }

        cols.push('full_name', 'wilaya', 'city', 'address', 'delivery_method');
        vals.push(fullName, wilaya, city, address, deliveryMethod);

        if (hasShippingCostColumn) {
          cols.push('shipping_cost');
          vals.push(shippingNum);
        }
        if (hasProductPriceColumn) {
          cols.push('product_price');
          vals.push(productNum);
        }

        cols.push('total', 'discount_percentage', 'status');
        vals.push(totalNum, discountPercentage || 0, 'pending');

        const placeholders = cols.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO orders (${cols.join(', ')}) VALUES (${placeholders})`;

        await pool.execute(insertSQL, vals);
        
        // Insert order items separately
        for (const item of items) {
          await pool.execute(`
            INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image, color, size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [orderId, item.id || null, item.name || '', item.price || 0, item.quantity || 1, item.image || null, item.color || null, item.size || null]);
        }
        
        console.log('✅ Order created successfully in database:', orderId);
        
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
      console.error('❌ Database operation failed:', dbError.message);
      return res.status(500).json({ 
        error: 'Database operation failed',
        details: dbError.message,
        message: 'Cannot save order to database'
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

// Get last order details by phone number
router.get('/last-by-phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const dbConnected = await ensureDBConnection();
    if (!dbConnected) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const [orders] = await pool.execute(
      'SELECT full_name, wilaya, city, address, delivery_method FROM orders WHERE phone = ? ORDER BY created_at DESC LIMIT 1',
      [phone]
    );

    if (orders.length > 0) {
      console.log('📋 Database order data:', orders[0]);
      res.json({ success: true, data: orders[0] });
    } else {
      res.status(404).json({ success: false, message: 'No orders found for this phone number' });
    }
  } catch (error) {
    console.error('Get last order by phone error:', error);
    res.status(500).json({ error: 'Failed to retrieve last order' });
  }
});

module.exports = router;
