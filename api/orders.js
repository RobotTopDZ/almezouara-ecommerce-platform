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
    // Retry connection once
    try {
      console.log('🔄 Retrying database connection...');
      await pool.execute('SELECT 1');
      console.log('✅ Database connection successful on retry');
      return true;
    } catch (retryError) {
      console.error('❌ Database connection retry failed:', retryError.message);
      return false;
    }
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
      
      // Check if customer has orders in the last 12 hours
      let existingOrder = null;
      if (phoneNumber) {
        try {
          const [existingOrders] = await pool.execute(
            'SELECT * FROM orders WHERE phone = ? AND datetime(created_at) >= datetime("now", "-12 hours")',
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
        // Create new order - use fixed schema for SQLite compatibility
        const totalNum = Number(total) || 0;
        const discountNum = Number(discountPercentage) || 0;

        console.log('🔧 Creating order with data:', { orderId, phoneNumber, fullName, wilaya, city, address, deliveryMethod, totalNum, discountNum });

        // Insert order with fixed schema and current date with precise time
        const now = new Date();
        const currentDate = now.toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:MM:SS
        // Get shipping cost and product price from order data
        const shippingCost = req.body.shippingCost || 0;
        const productPrice = totalNum; // Le prix total des produits sans les frais de livraison
        
        await pool.execute(`
          INSERT INTO orders (id, phone, full_name, wilaya, city, address, delivery_method, total, discount_percentage, status, date, shipping_cost, product_price)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, phoneNumber || null, fullName, wilaya, city, address, deliveryMethod, totalNum, discountNum, 'pending', currentDate, shippingCost, productPrice]);
        
        console.log('✅ Order inserted successfully');
        
        // Start a transaction for order creation
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        console.log('✅ Transaction started');
        
        try {
          // Validate stock before processing order
          for (const item of items) {
            const variantId = item.variantId || null;
            const quantity = item.quantity || 1;
            
            if (variantId) {
              // Check variant stock
              const [variantStock] = await connection.execute(
                'SELECT stock FROM product_variants WHERE id = ?',
                [variantId]
              );
              
              if (variantStock.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                  success: false,
                  error: `Variant not found for product: ${item.name}`
                });
              }
              
              if (variantStock[0].stock < quantity) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                  success: false,
                  error: `Stock insuffisant pour ${item.name}. Stock disponible: ${variantStock[0].stock}, Quantité demandée: ${quantity}`
                });
              }
            } else {
              // Check product stock
              const [productStock] = await connection.execute(
                'SELECT stock FROM products WHERE id = ?',
                [item.id]
              );
              
              if (productStock.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                  success: false,
                  error: `Product not found: ${item.name}`
                });
              }
              
              if (productStock[0].stock < quantity) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                  success: false,
                  error: `Stock insuffisant pour ${item.name}. Stock disponible: ${productStock[0].stock}, Quantité demandée: ${quantity}`
                });
              }
            }
          }
          
          // Insert order items and update stock
          for (const item of items) {
            const variantId = item.variantId || null;
            const quantity = item.quantity || 1;
            
            // Insert order item
            await connection.execute(`
              INSERT INTO order_items (order_id, product_id, variant_id, product_name, price, quantity, image, color, size)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              orderId, 
              item.id || null, 
              variantId,
              item.name || '', 
              item.price || 0, 
              quantity, 
              item.image || null, 
              item.color || null, 
              item.size || null
            ]);
            
            // Update stock
            if (variantId) {
              // Update variant stock (MySQL compatible)
              await connection.execute(
                'UPDATE product_variants SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                [quantity, variantId]
              );
              
              // Update product stock (sum of all variants) - SQLite compatible
              await connection.execute(`
                UPDATE products
                SET stock = (
                  SELECT COALESCE(SUM(stock), 0)
                  FROM product_variants
                  WHERE product_id = products.id
                )
                WHERE id = ?
              `, [item.id]);
            } else {
              // For products without variants (MySQL compatible)
              await connection.execute(
                'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                [quantity, item.id]
              );
            }
          }
          
          await connection.commit();
          connection.release();
          
        } catch (error) {
          await connection.rollback();
          connection.release();
          console.error('Order processing failed:', error);
          throw error;
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
    console.log('🔍 Fetching orders from database...');
    
    if (!pool) {
      console.log('❌ No database pool available');
      return res.json({ orders: [] });
    }
    
    // Récupérer les commandes
    const [orders] = await pool.execute(`
      SELECT o.*
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 100
    `);

    // Pour chaque commande, récupérer les détails des produits
    const ordersWithItems = [];
    for (const order of orders) {
      try {
        // Récupérer les articles de la commande
        const [items] = await pool.execute(`
          SELECT product_id, variant_id, product_name, price, quantity, image, color, size
          FROM order_items
          WHERE order_id = ?
        `, [order.id]);
        
        // Ajouter les articles à la commande
        ordersWithItems.push({
          ...order,
          items: items
        });
      } catch (itemError) {
        console.error(`Error fetching items for order ${order.id}:`, itemError);
        // Ajouter la commande sans articles en cas d'erreur
        ordersWithItems.push({
          ...order,
          items: []
        });
      }
    }

    console.log('📋 Found orders:', ordersWithItems.length);
    res.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Get orders error:', error);
    res.json({ orders: [] });
  }
});

// Update order status
router.put('/update-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, price, deliveryMethod } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    const dbConnected = await ensureDBConnection();
    if (!dbConnected) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    let query = 'UPDATE orders SET';
    const params = [];
    
    if (status) {
      query += ' status = ?';
      params.push(status);
    }
    
    if (price !== undefined) {
      if (params.length > 0) query += ',';
      query += ' total = ?, product_price = ?';
      params.push(price, price);
    }
    
    if (deliveryMethod) {
      if (params.length > 0) query += ',';
      query += ' delivery_method = ?';
      params.push(deliveryMethod);
    }
    
    query += ' WHERE id = ?';
    params.push(orderId);
    
    await pool.execute(query, params);
    
    return res.json({ 
      success: true, 
      message: 'Order updated successfully' 
    });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({ 
      error: 'Failed to update order',
      details: error.message 
    });
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
