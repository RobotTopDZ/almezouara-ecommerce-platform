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
    // Récupérer toutes les commandes sans limite
    const [orders] = await pool.execute(`
      SELECT o.*, 
             o.full_name as fullName,
             o.phone as phoneNumber
      FROM orders o
      ORDER BY o.created_at DESC
    `);
    
    // Pour chaque commande, récupérer les détails des produits
    for (const order of orders) {
      const [items] = await pool.execute(`
        SELECT 
          product_id,
          product_name as name,
          price,
          quantity,
          image,
          color,
          size
        FROM order_items
        WHERE order_id = ?
      `, [order.id]);
      
      // Ajouter les items à la commande
      order.items = items;
    }
    
    // Regrouper les commandes du même numéro de téléphone dans les dernières 24 heures (1 jour)
    const groupedOrders = [];
    const processedOrderIds = new Set();
    
    for (const order of orders) {
      // Si la commande a déjà été traitée dans un groupe, on la saute
      if (processedOrderIds.has(order.id)) continue;
      
      // Si la commande n'a pas de numéro de téléphone, on l'ajoute telle quelle
      if (!order.phoneNumber) {
        groupedOrders.push(order);
        continue;
      }
      
      // Chercher toutes les commandes du même numéro de téléphone dans les 24 dernières heures (1 jour)
      const relatedOrders = orders.filter(o => 
        o.phoneNumber === order.phoneNumber && 
        o.id !== order.id &&
        !processedOrderIds.has(o.id) &&
        Math.abs(new Date(o.date || o.created_at) - new Date(order.date || order.created_at)) < 24 * 60 * 60 * 1000
      );
      
      // Si on a trouvé des commandes liées, on les regroupe
      if (relatedOrders.length > 0) {
        // Marquer toutes les commandes liées comme traitées
        relatedOrders.forEach(o => processedOrderIds.add(o.id));
        
        // Créer une commande groupée
        const groupedOrder = { ...order };
        groupedOrder.isGrouped = true;
        groupedOrder.relatedOrders = relatedOrders;
        groupedOrder.originalId = order.id;
        groupedOrder.groupedIds = [order.id, ...relatedOrders.map(o => o.id)];
        
        // Ajouter tous les items des commandes liées
        groupedOrder.items = [...order.items];
        let totalProductsPrice = parseFloat(order.total || 0);
        let shippingFee = 0;
        
        // Extraire les frais de livraison de la première commande
        // On suppose que les frais de livraison sont la différence entre le total et le prix des produits
        const orderItemsTotal = order.items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
        shippingFee = Math.max(0, totalProductsPrice - orderItemsTotal);
        
        // Ajouter les articles et calculer le prix total des produits
        relatedOrders.forEach(o => {
          if (o.items && o.items.length) {
            groupedOrder.items = [...groupedOrder.items, ...o.items];
            // Ajouter seulement le prix des produits, pas les frais de livraison
            const itemsTotal = o.items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
            totalProductsPrice += itemsTotal;
          }
        });
        
        // Calculer le nouveau total: prix total des produits + frais de livraison (une seule fois)
        groupedOrder.total = totalProductsPrice + shippingFee;
        groupedOrder.productsTotal = totalProductsPrice;
        groupedOrder.shippingFee = shippingFee;
        
        groupedOrders.push(groupedOrder);
      } else {
        // Si pas de commandes liées, ajouter la commande telle quelle
        groupedOrders.push(order);
      }
      
      // Marquer cette commande comme traitée
      processedOrderIds.add(order.id);
    }
    
    // Retourner les commandes groupées au lieu des commandes originales
    res.json({ orders: groupedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Get all promotions (admin)
router.get('/promotions', async (req, res) => {
  try {
    // Fix collation conflict by using COLLATE in JOIN
    const [promotions] = await pool.execute(`
      SELECT p.*, a.name as customer_name 
      FROM promotions p 
      LEFT JOIN accounts a ON p.phone COLLATE utf8mb4_0900_ai_ci = a.phone COLLATE utf8mb4_0900_ai_ci
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
    const { phoneNumber, percentage, description, usageLimit = 1, isActive = true } = req.body;
    
    console.log('Admin promotion creation:', { phoneNumber, percentage, description, usageLimit, isActive });
    
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
      [promotionId, phoneNumber, percentage, description || '', usageLimit, 0, isActive]
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
        isActive
      }
    });
    
  } catch (error) {
    console.error('Admin create promotion error:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

// Update promotion (admin)
router.put('/promotions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber, percentage, description, usageLimit, isActive } = req.body;
    
    console.log('Admin promotion update:', { id, phoneNumber, percentage, description, usageLimit, isActive });
    
    await pool.execute(
      'UPDATE promotions SET phone = ?, percentage = ?, description = ?, usage_limit = ?, is_active = ? WHERE id = ?',
      [phoneNumber, percentage, description || '', usageLimit, isActive, id]
    );
    
    res.json({
      success: true,
      message: 'Promotion updated successfully'
    });
    
  } catch (error) {
    console.error('Admin update promotion error:', error);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

// Delete promotion (admin)
router.delete('/promotions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Admin promotion deletion:', { id });
    
    const [result] = await pool.execute(
      'DELETE FROM promotions WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    
    res.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
    
  } catch (error) {
    console.error('Admin delete promotion error:', error);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

// ===== CATEGORIES MANAGEMENT =====

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    
    res.json({
      success: true,
      categoryId: result.insertId,
      message: 'Category created successfully'
    });
    
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    await pool.execute(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || '', id]
    );
    
    res.json({
      success: true,
      message: 'Category updated successfully'
    });
    
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ===== PRODUCTS MANAGEMENT =====

// Get all products
router.get('/products', async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `);
    
    // Parse JSON fields
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images) : [],
      colors: product.colors ? (typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors) : [],
      sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : []
    }));
    
    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Create product
router.post('/products', async (req, res) => {
  try {
    const { name, description, price, categoryId, images, colors, sizes, stockQuantity } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, price, category_id, images, colors, sizes, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description || '',
        price,
        categoryId || null,
        JSON.stringify(images || []),
        JSON.stringify(colors || []),
        JSON.stringify(sizes || []),
        stockQuantity || 0
      ]
    );
    
    res.json({
      success: true,
      productId: result.insertId,
      message: 'Product created successfully'
    });
    
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, images, colors, sizes, stockQuantity, isActive } = req.body;
    
    await pool.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, images = ?, colors = ?, sizes = ?, stock_quantity = ?, is_active = ? WHERE id = ?',
      [
        name,
        description || '',
        price,
        categoryId || null,
        JSON.stringify(images || []),
        JSON.stringify(colors || []),
        JSON.stringify(sizes || []),
        stockQuantity || 0,
        isActive,
        id
      ]
    );
    
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
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
