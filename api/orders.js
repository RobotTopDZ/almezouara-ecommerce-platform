const express = require('express');
const { pool } = require('./config/database');

const router = express.Router();

// Orders
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, items, total, deliveryMethod, address, fullName, wilaya, city, shippingCost, productPrice, discountPercentage } = req.body || {};
    
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
        [total, productPrice, existingOrder.id]
      );
      
      return res.json({ 
        ok: true, 
        order: { ...existingOrder, total: existingOrder.total + total, productPrice: existingOrder.productPrice + productPrice }, 
        message: 'Items added to existing order for today',
        orderType: 'merged'
      });
    } else {
      // Create new order
      await pool.execute(`
        INSERT INTO orders (id, phone, date, total, status, delivery_method, address, full_name, wilaya, city, shipping_cost, product_price, discount_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderId, phoneNumber || null, today, total, 'processing', deliveryMethod, address, fullName, wilaya, city, shippingCost, productPrice, discountPercentage || 0]);
      
      // Add order items
      for (const item of items) {
        await pool.execute(`
          INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image, color, size)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, item.id || null, item.name || '', item.price || 0, item.quantity || 1, item.image || null, item.color || null, item.size || null]);
      }
      
      // Create customer account if phone provided and doesn't exist
      if (phoneNumber) {
        const [existingAccount] = await pool.execute(
          'SELECT phone FROM accounts WHERE phone = ?',
          [phoneNumber]
        );
        
        if (existingAccount.length === 0) {
          await pool.execute(
            'INSERT INTO accounts (phone, name, password) VALUES (?, ?, ?)',
            [phoneNumber, fullName, '']
          );
        }
      }
      
      const order = { 
        id: orderId, 
        date: today, 
        total, 
        status: 'processing', 
        items, 
        deliveryMethod, 
        address, 
        fullName, 
        wilaya,
        city,
        phoneNumber,
        shippingCost,
        productPrice,
        discountPercentage: discountPercentage || 0,
        createdAt: new Date().toISOString()
      };
      
      res.json({ ok: true, order, orderType: 'new' });
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create order: ' + error.message,
      details: error.message
    });
  }
});

module.exports = router;
