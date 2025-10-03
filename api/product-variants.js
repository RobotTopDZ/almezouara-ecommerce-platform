const express = require('express');
const router = express.Router();
const { pool } = require('./config/database');

// Get all variants for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const [variants] = await pool.execute(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY color_name, size',
      [req.params.productId]
    );
    res.json({ success: true, variants });
  } catch (error) {
    console.error('Get variants error:', error);
    res.status(500).json({ error: 'Failed to get variants' });
  }
});

// Get single variant
router.get('/:id', async (req, res) => {
  try {
    const [variants] = await pool.execute(
      'SELECT * FROM product_variants WHERE id = ?',
      [req.params.id]
    );
    
    if (variants.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    res.json({ success: true, variant: variants[0] });
  } catch (error) {
    console.error('Get variant error:', error);
    res.status(500).json({ error: 'Failed to get variant' });
  }
});

// Create variant
router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      color_name,
      color_value = '#000000',
      size,
      stock = 0,
      sku = null,
      barcode = null,
      price_adjustment = 0
    } = req.body;

    // Validate required fields
    if (!product_id || !color_name || !size) {
      return res.status(400).json({ error: 'Product ID, color name, and size are required' });
    }

    // Check if variant already exists
    const [existing] = await pool.execute(
      'SELECT id FROM product_variants WHERE product_id = ? AND LOWER(color_name) = LOWER(?) AND LOWER(size) = LOWER(?)',
      [product_id, color_name, size]
    );

    if (existing.length > 0) {
      // Update existing variant
      await pool.execute(
        `UPDATE product_variants SET 
          color_value = ?, 
          stock = ?, 
          sku = ?, 
          barcode = ?, 
          price_adjustment = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [color_value, stock, sku, barcode, price_adjustment, existing[0].id]
      );
      
      // Get the updated variant
      const [updated] = await pool.execute('SELECT * FROM product_variants WHERE id = ?', [existing[0].id]);
      return res.json({ success: true, variant: updated[0], updated: true });
    }

    // Create new variant
    const [result] = await pool.execute(
      `INSERT INTO product_variants 
        (product_id, color_name, color_value, size, stock, sku, barcode, price_adjustment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_id, color_name, color_value, size, stock, sku, barcode, price_adjustment]
    );
    
    // Get the created variant
    const [created] = await pool.execute('SELECT * FROM product_variants WHERE id = ?', [result.insertId]);
    res.json({ success: true, variant: created[0], created: true });
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ error: 'Failed to create variant' });
  }
});

// Update variant
router.put('/:id', async (req, res) => {
  try {
    const {
      color_name,
      color_value = '#000000',
      size,
      stock = 0,
      sku = null,
      barcode = null,
      price_adjustment = 0
    } = req.body;

    // Validate required fields
    if (!color_name || !size) {
      return res.status(400).json({ error: 'Color name and size are required' });
    }

    // Update variant
    await pool.execute(
      `UPDATE product_variants SET 
        color_name = ?,
        color_value = ?, 
        size = ?,
        stock = ?, 
        sku = ?, 
        barcode = ?, 
        price_adjustment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [color_name, color_value, size, stock, sku, barcode, price_adjustment, req.params.id]
    );
    
    // Get the updated variant
    const [updated] = await pool.execute('SELECT * FROM product_variants WHERE id = ?', [req.params.id]);
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    res.json({ success: true, variant: updated[0] });
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

// Delete variant
router.delete('/:id', async (req, res) => {
  try {
    // Check if variant exists
    const [variant] = await pool.execute('SELECT product_id FROM product_variants WHERE id = ?', [req.params.id]);
    
    if (variant.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    // Delete variant
    await pool.execute('DELETE FROM product_variants WHERE id = ?', [req.params.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
});

module.exports = router;