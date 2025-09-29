const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Import database configuration with proper path resolution
const { pool, initializeDatabase } = require('./config/database');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'images', 'products');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Initialize tables if they don't exist
const initializeTables = async () => {
  try {
    if (!pool) {
      console.log("Waiting for database connection...");
      return;
    }
    
    // Check if we're using SQLite and skip MySQL-specific table creation
    const dbConfig = require('./config/database');
    if (dbConfig.usingSQLite) {
      console.log('Using SQLite database - tables already initialized');
      return;
    }
    
    // Create categories table (MySQL syntax)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        image_url VARCHAR(255),
        color VARCHAR(50),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create products table (MySQL syntax)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category_id INT,
        images TEXT,
        stock INT DEFAULT 0,
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
        product_type ENUM('simple', 'variable') DEFAULT 'simple',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    
    console.log('Product and category tables are initialized.');
  } catch (error) {
    console.error("Error initializing tables:", error);
  }
};

initializeTables();
// Helper function to format product data
const formatProduct = async (product) => {
  // Basic product data
  const formatted = { ...product };

  // Parse JSON fields safely
  try {
    formatted.images = product.images ? JSON.parse(product.images) : [];
  } catch (e) {
    formatted.images = [];
  }

  return formatted;
};

// Helper function to format product with variants
async function formatProductWithVariants(product) {
  if (!product) return null;
  
  const connection = await pool.getConnection();
  try {
    const formattedProduct = await formatProduct(product);
    
    // Only fetch variants for variable products
    if (product.product_type === 'variable') {
      const [variants] = await connection.execute(
        'SELECT * FROM product_variants WHERE product_id = ?',
        [product.id]
      );
      
      formattedProduct.variants = variants || [];
      
      // Calculate total stock from variants
      if (variants && variants.length > 0) {
        formattedProduct.stock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      }
    } else {
      formattedProduct.variants = [];
    }
    
    return formattedProduct;
  } catch (error) {
    console.error('Error formatting product with variants:', error);
    return formatProduct(product); // Fallback to basic formatting
  } finally {
    if (connection) connection.release();
  }
}

// Get all products
router.get('/', async (req, res) => {
  try {
    if (!pool) {
      // Fallback mock data when database is not connected
      const mockProducts = [
        { id: 1, name: 'Elegant Abaya', price: '79.99', images: ['/uploads/mock-abaya.jpg'], product_type: 'simple', category_id: 3 },
        { id: 2, name: 'Chiffon Hijab', price: '19.99', images: ['/uploads/mock-hijab.jpg'], product_type: 'variable', category_id: 2, variants: [{ color: 'Black', size: 'Standard', stock: 10 }] },
      ];
      return res.json({ success: true, products: mockProducts });
    }

    const [products] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
    const formattedProducts = await Promise.all(products.map(formatProduct));
    
    res.json({ success: true, products: formattedProducts });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    if (!pool) {
      // Fallback mock data
      const mockProduct = { id: req.params.id, name: 'Sample Product', price: '49.99', images: ['/uploads/mock-product.jpg'], product_type: 'simple' };
      return res.json({ success: true, product: mockProduct });
    }

    const [productRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Use formatProductWithVariants instead of formatProduct to include variants
    const product = await formatProductWithVariants(productRows[0]);
    res.json({ success: true, product });
  } catch (error) {
    console.error('Get single product error:', error);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// Create a new product with variants support
router.post('/', async (req, res) => {
  const {
    name, 
    description, 
    price, 
    category_id, 
    images = [], 
    product_type = 'simple', 
    variants = [],
    stock = 0
  } = req.body;

  // Input validation
  if (!name || !price) {
    return res.status(400).json({ 
      success: false,
      error: 'Product name and price are required' 
    });
  }

  // For variable products, ensure variants are provided
  if (product_type === 'variable' && (!Array.isArray(variants) || variants.length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'At least one variant is required for variable products'
    });
  }

  const transaction = await pool.getConnection();
  try {
    await transaction.beginTransaction();

    // Calculate initial stock (will be updated for variable products)
    let initialStock = product_type === 'simple' ? parseInt(stock) || 0 : 0;
    
    // Vérifier si la colonne product_type existe
    let hasProductTypeColumn = true;
    try {
      const [columns] = await transaction.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'product_type'
      `);
      hasProductTypeColumn = columns.length > 0;
      
      // Si la colonne n'existe pas, l'ajouter
      if (!hasProductTypeColumn) {
        console.log('⚠️ Colonne product_type manquante, tentative d\'ajout...');
        await transaction.execute(`
          ALTER TABLE products 
          ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
        `);
        console.log('✅ Colonne product_type ajoutée avec succès');
        hasProductTypeColumn = true;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification/ajout de la colonne:', error);
    }
    
    // Insert into products table avec ou sans product_type selon sa présence
    const [result] = await transaction.execute(
      hasProductTypeColumn 
        ? `INSERT INTO products 
           (name, description, price, category_id, images, product_type, stock, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        : `INSERT INTO products 
           (name, description, price, category_id, images, stock, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
      hasProductTypeColumn
        ? [name, description, price, category_id, JSON.stringify(images), product_type, initialStock, 'active']
        : [name, description, price, category_id, JSON.stringify(images), initialStock, 'active']
    );
    
    const productId = result.insertId;
    let totalStock = 0;

    // Handle variants for variable products
    if (product_type === 'variable' && variants.length > 0) {
      for (const variant of variants) {
        const {
          color_name = 'Default',
          color_value = '#000000',
          size = 'One Size',
          stock: variantStock = 0,
          sku = null,
          barcode = null,
          price_adjustment = 0.00
        } = variant;

        // Générer un SKU unique si null ou vide
        const variantSku = sku || '';
        const finalSku = variantSku.trim() === '' ? 
          `${slug}-${color_name.toLowerCase().replace(/\s+/g, '-')}-${size.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}` : 
          variantSku;

        // Insert variant
        await transaction.execute(
          `INSERT INTO product_variants 
           (product_id, color_name, color_value, size, stock, sku, barcode, price_adjustment)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productId,
            color_name,
            color_value,
            size,
            variantStock,
            finalSku,
            barcode,
            price_adjustment
          ]
        );
        
        totalStock += parseInt(variantStock) || 0;
      }

      // Update the main product stock to be the sum of all variants
      await transaction.execute(
        'UPDATE products SET stock = ? WHERE id = ?',
        [totalStock, productId]
      );
    }

    await transaction.commit();
    
    // Fetch the newly created product with variants
    const [newProductRows] = await pool.execute(
      'SELECT * FROM products WHERE id = ?', 
      [productId]
    );
    
    if (newProductRows.length === 0) {
      throw new Error('Failed to retrieve created product');
    }
    
    const newProduct = await formatProductWithVariants(newProductRows[0]);
    
    res.status(201).json({ 
      success: true, 
      product: newProduct,
      message: 'Product created successfully'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create product',
      message: error.message
    });
  } finally {
    if (transaction) await transaction.release();
  }
});

// Update a product with variants support
router.put('/:id', async (req, res) => {
  const productId = req.params.id;
  const {
    name, 
    description, 
    price, 
    category_id, 
    images = [], 
    product_type = 'simple', 
    variants = [],
    stock = 0
  } = req.body;

  // Input validation
  if (!name || !price) {
    return res.status(400).json({ 
      success: false,
      error: 'Product name and price are required' 
    });
  }

  // For variable products, ensure variants are provided
  if (product_type === 'variable' && (!Array.isArray(variants) || variants.length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'At least one variant is required for variable products'
    });
  }

  const transaction = await pool.getConnection();
  try {
    await transaction.beginTransaction();

    // Verify product exists
    const [existingProducts] = await transaction.execute(
      'SELECT id FROM products WHERE id = ? FOR UPDATE',
      [productId]
    );

    if (existingProducts.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Calculate initial stock (will be updated for variable products)
    let updatedStock = product_type === 'simple' ? parseInt(stock) || 0 : 0;
    
    // Update products table
    await transaction.execute(
      `UPDATE products SET
        name = ?, 
        description = ?, 
        price = ?, 
        category_id = ?,
        images = ?, 
        product_type = ?, 
        stock = ?, 
        updated_at = NOW()
      WHERE id = ?`,
      [
        name, 
        description, 
        price, 
        category_id, 
        JSON.stringify(images), 
        product_type, 
        updatedStock,
        productId
      ]
    );

    let totalStock = 0;

    // Handle variants for variable products
    if (product_type === 'variable' && variants.length > 0) {
      // Get existing variants to compare
      const [existingVariants] = await transaction.execute(
        'SELECT id FROM product_variants WHERE product_id = ?',
        [productId]
      );
      
      const existingVariantIds = existingVariants.map(v => v.id);
      const updatedVariantIds = [];

      // Process each variant in the request
      for (const variant of variants) {
        const {
          id: variantId,
          id,
          color_name = 'Default',
          color_value = '#000000',
          size = 'One Size',
          stock: variantStock = 0,
          sku = null,
          barcode = null,
          price_adjustment = 0.00
        } = variant;

        if (id) {
          // Update existing variant
          await transaction.execute(
            `UPDATE product_variants SET
              color_name = ?,
              color_value = ?,
              size = ?,
              stock = ?,
              sku = ?,
              barcode = ?,
              price_adjustment = ?,
              updated_at = NOW()
            WHERE id = ? AND product_id = ?`,
            [
              color_name,
              color_value,
              size,
              variantStock,
              sku,
              barcode,
              price_adjustment,
              id,
              productId
            ]
          );
          updatedVariantIds.push(id);
        } else {
          // Insert new variant
          const [result] = await transaction.execute(
            `INSERT INTO product_variants 
             (product_id, color_name, color_value, size, stock, sku, barcode, price_adjustment)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              color_name,
              color_value,
              size,
              variantStock,
              sku,
              barcode,
              price_adjustment
            ]
          );
          updatedVariantIds.push(result.insertId);
        }
        
        totalStock += parseInt(variantStock) || 0;
      }

      // Delete variants that were removed
      const variantsToDelete = existingVariantIds.filter(id => !updatedVariantIds.includes(id));
      if (variantsToDelete.length > 0) {
        await transaction.query(
          'DELETE FROM product_variants WHERE id IN (?)',
          [variantsToDelete]
        );
      }

      // Update the main product stock to be the sum of all variants
      if (product_type === 'variable') {
        await transaction.execute(
          'UPDATE products SET stock = ? WHERE id = ?',
          [totalStock, productId]
        );
      }
    } else if (product_type === 'simple') {
      // For simple products, remove any existing variants
      await transaction.execute(
        'DELETE FROM product_variants WHERE product_id = ?',
        [productId]
      );
    }

    // Commit the transaction
    await transaction.commit();
    
    // Fetch the updated product with variants
    const [updatedProductRows] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );
    
    if (updatedProductRows.length === 0) {
      throw new Error('Failed to retrieve updated product');
    }
    
    const updatedProduct = await formatProductWithVariants(updatedProductRows[0]);
    
    res.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      message: error.message
    });
  } finally {
    if (transaction) await transaction.release();
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  const transaction = await pool.getConnection();
  try {
    await transaction.beginTransaction();
    
    // Check if product exists
    const [productCheck] = await transaction.execute('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (productCheck.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete order items that reference this product (if any)
    await transaction.execute('DELETE FROM order_items WHERE product_id = ?', [req.params.id]);
    
    // Delete all variants (if table exists)
    try {
      await transaction.execute('DELETE FROM product_variants WHERE product_id = ?', [req.params.id]);
    } catch (variantError) {
      // If table doesn't exist, log and continue
      if (variantError.code === 'ER_NO_SUCH_TABLE') {
        console.log('product_variants table does not exist, skipping variant deletion');
      } else {
        // For other errors, rethrow
        throw variantError;
      }
    }
    
    // Finally delete the product
    const [result] = await transaction.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    await transaction.commit();
    res.json({ success: true, message: 'Product and all related data deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete product error:', error);
    res.status(500).json({ 
      error: 'Failed to delete product', 
      details: error.message 
    });
  } finally {
    if (transaction) await transaction.release();
  }
});

// Helper function to update product stock based on variants
async function updateProductStock(transaction, productId) {
  // Get sum of all variant stocks
  const [result] = await transaction.execute(
    'SELECT COALESCE(SUM(stock), 0) as total_stock FROM product_variants WHERE product_id = ?',
    [productId]
  );
  
  const totalStock = result[0].total_stock;
  
  // Update product stock and status
  await transaction.execute(
    `UPDATE products 
     SET stock = ?, 
         status = CASE WHEN ? > 0 THEN 'active' ELSE 'out_of_stock' END,
         updated_at = NOW() 
     WHERE id = ?`,
    [totalStock, totalStock, productId]
  );
  
  return totalStock;
}

// Helper function to format product with variants
async function formatProductWithVariants(product) {
  // Parse JSON fields
  let images = [];
  let colors = [];
  let sizes = [];
  
  // Handle images
  if (product.images) {
    if (typeof product.images === 'string') {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        images = [product.images];
      }
    } else if (Array.isArray(product.images)) {
      images = product.images;
    }
  }
  
  // Handle colors
  if (product.colors) {
    if (typeof product.colors === 'string') {
      try {
        colors = JSON.parse(product.colors);
      } catch (e) {
        colors = [{ name: product.colors, value: '#000000' }];
      }
    } else if (Array.isArray(product.colors)) {
      colors = product.colors;
    }
  }
  
  // Handle sizes
  if (product.sizes) {
    if (typeof product.sizes === 'string') {
      try {
        sizes = JSON.parse(product.sizes);
      } catch (e) {
        sizes = product.sizes.split(',').map(s => s.trim()).filter(s => s);
      }
    } else if (Array.isArray(product.sizes)) {
      sizes = product.sizes;
    }
  }
  
  // Get variants for this product
  const [variants] = await pool.execute(
    'SELECT * FROM product_variants WHERE product_id = ?',
    [product.id]
  );
  
  return {
    ...product,
    images,
    colors,
    sizes,
    variants: variants || []
  };
}

// Add variant routes
const productVariantsRouter = require('./productVariants');
router.use('/', productVariantsRouter);

// Get categories for dropdown
router.get('/categories/list', async (req, res) => {
  try {
    if (!pool) {
      // Fallback categories when database is not connected
      const categories = [
        { id: 1, name: 'Robes', color: '#FF6B6B' },
        { id: 2, name: 'Hijabs', color: '#4ECDC4' },
        { id: 3, name: 'Abayas', color: '#45B7D1' },
        { id: 4, name: 'Accessoires', color: '#96CEB4' },
        { id: 5, name: 'Chaussures', color: '#FFEAA7' }
      ];
      return res.json({ success: true, categories });
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

// Clean up corrupted JSON data (admin endpoint)
router.post('/cleanup', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    console.log('🧹 Cleaning up corrupted JSON data...');
    
    // Get all products
    const [products] = await pool.execute('SELECT id, images, colors, sizes FROM products');
    
    let cleanedCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      let cleanImages = '[]';
      let cleanColors = '[]';
      let cleanSizes = '[]';
      
      // Check and fix images
      if (product.images) {
        try {
          JSON.parse(product.images);
          cleanImages = product.images;
        } catch (e) {
          console.log(`Fixing images for product ${product.id}:`, product.images);
          // If it's a URL string, wrap it in array
          if (typeof product.images === 'string' && product.images.startsWith('http')) {
            cleanImages = JSON.stringify([product.images]);
          } else {
            cleanImages = '[]';
          }
          needsUpdate = true;
        }
      }
      
      // Check and fix colors
      if (product.colors) {
        try {
          JSON.parse(product.colors);
          cleanColors = product.colors;
        } catch (e) {
          console.log(`Fixing colors for product ${product.id}:`, product.colors);
          cleanColors = '[]';
          needsUpdate = true;
        }
      }
      
      // Check and fix sizes
      if (product.sizes) {
        try {
          JSON.parse(product.sizes);
          cleanSizes = product.sizes;
        } catch (e) {
          console.log(`Fixing sizes for product ${product.id}:`, product.sizes);
          cleanSizes = '[]';
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await pool.execute(
          'UPDATE products SET images = ?, colors = ?, sizes = ? WHERE id = ?',
          [cleanImages, cleanColors, cleanSizes, product.id]
        );
        cleanedCount++;
      }
    }
    
    console.log(`✅ Cleaned up ${cleanedCount} products`);
    res.json({ 
      success: true, 
      message: `Cleaned up ${cleanedCount} products with corrupted JSON data`,
      cleanedCount 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup data' });
  }
});

module.exports = router;
