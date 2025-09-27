const express = require('express');
const router = express.Router();
const { pool } = require('./config/database');

// Initialize tables if they don't exist
const initializeTables = async () => {
  try {
    // Create categories table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6B7280',
        icon VARCHAR(50) DEFAULT 'category',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create products table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        category_id INT,
        price DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        description TEXT,
        images JSON,
        colors JSON,
        sizes JSON,
        status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    
    // Insert default categories if they don't exist
    await pool.execute(`
      INSERT IGNORE INTO categories (id, name, description, color, icon) VALUES
      (1, 'Robes', 'Robes élégantes pour toutes les occasions', '#FF6B6B', 'dress'),
      (2, 'Hijabs', 'Hijabs modernes et confortables', '#4ECDC4', 'hijab'),
      (3, 'Abayas', 'Abayas traditionnelles et modernes', '#45B7D1', 'abaya'),
      (4, 'Accessoires', 'Accessoires pour compléter votre look', '#96CEB4', 'accessories'),
      (5, 'Chaussures', 'Chaussures confortables et stylées', '#FFEAA7', 'shoes')
    `);
    
    console.log('✅ Products and categories tables initialized');
  } catch (error) {
    console.error('❌ Error initializing tables:', error.message);
  }
};

// Initialize tables on first load
initializeTables();

// Get all products
router.get('/', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    
    // Parse JSON fields
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      colors: product.colors ? JSON.parse(product.colors) : [],
      sizes: product.sizes ? JSON.parse(product.sizes) : []
    }));
    
    res.json({ success: true, products: formattedProducts });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = {
      ...products[0],
      images: products[0].images ? JSON.parse(products[0].images) : [],
      colors: products[0].colors ? JSON.parse(products[0].colors) : [],
      sizes: products[0].sizes ? JSON.parse(products[0].sizes) : []
    };
    
    res.json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const {
      name,
      category_id,
      price,
      stock,
      description,
      images,
      colors,
      sizes,
      status
    } = req.body;
    
    console.log('Creating product:', { name, category_id, price, stock, status });
    
    // Validate required fields
    if (!name || !category_id || !price || stock === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO products (
        name, category_id, price, stock, description, 
        images, colors, sizes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name,
      category_id,
      parseFloat(price),
      parseInt(stock),
      description || '',
      JSON.stringify(images || []),
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      status || 'active'
    ]);
    
    res.json({ 
      success: true, 
      message: 'Product created successfully',
      productId: result.insertId 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      category_id,
      price,
      stock,
      description,
      images,
      colors,
      sizes,
      status
    } = req.body;
    
    const [result] = await pool.execute(`
      UPDATE products SET
        name = ?, category_id = ?, price = ?, stock = ?, description = ?,
        images = ?, colors = ?, sizes = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      name,
      category_id,
      parseFloat(price),
      parseInt(stock),
      description || '',
      JSON.stringify(images || []),
      JSON.stringify(colors || []),
      JSON.stringify(sizes || []),
      status || 'active',
      req.params.id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get categories for dropdown
router.get('/categories/list', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const [categories] = await pool.execute(`
      SELECT id, name, color, icon, description
      FROM categories
      ORDER BY name ASC
    `);
    
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

module.exports = router;
