const express = require('express');
const router = express.Router();
const { pool } = require('./config/database');

// Get all variants for a product
router.get('/product/:productId/variants', async (req, res) => {
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
router.get('/variants/:id', async (req, res) => {
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

// Create or update variant
router.post('/variants', async (req, res) => {
  const transaction = await pool.getConnection();
  try {
    await transaction.beginTransaction();
    
    const {
      product_id,
      color_name,
      color_value = '#000000',
      size,
      stock = 0,
      sku = null,
      barcode = null,
      price_adjustment = 0,
      image_url = null
    } = req.body;

    // Validate required fields
    if (!product_id || !color_name || !size) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Product ID, color name, and size are required' });
    }

    // Check if variant already exists
    const [existing] = await transaction.execute(
      'SELECT id FROM product_variants WHERE product_id = ? AND LOWER(color_name) = LOWER(?) AND LOWER(size) = LOWER(?)',
      [product_id, color_name, size]
    );

    let variantId;
    
    if (existing.length > 0) {
      // Update existing variant
      variantId = existing[0].id;
      await transaction.execute(
        `UPDATE product_variants SET 
          color_value = ?, 
          stock = ?, 
          sku = ?, 
          barcode = ?, 
          price_adjustment = ?,
          image_url = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [color_value, stock, sku, barcode, price_adjustment, image_url, variantId]
      );
    } else {
      // Create new variant
      const [result] = await transaction.execute(
        `INSERT INTO product_variants 
          (product_id, color_name, color_value, size, stock, sku, barcode, price_adjustment, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [product_id, color_name, color_value, size, stock, sku, barcode, price_adjustment, image_url]
      );
      variantId = result.insertId;
    }

    // Update parent product stock (sum of all variants)
    await updateProductStock(transaction, product_id);
    
    await transaction.commit();
    
    // Get the updated variant
    const [variant] = await pool.execute(
      'SELECT * FROM product_variants WHERE id = ?',
      [variantId]
    );
    
    res.json({ 
      success: true, 
      message: existing.length > 0 ? 'Variant updated successfully' : 'Variant created successfully',
      variant: variant[0]
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Save variant error:', error);
    res.status(500).json({ error: 'Failed to save variant' });
  } finally {
    if (transaction) await transaction.release();
  }
});

// Delete variant
router.delete('/variants/:id', async (req, res) => {
  const transaction = await pool.getConnection();
  try {
    await transaction.beginTransaction();
    
    // Get variant to get product_id for stock update
    const [variants] = await transaction.execute(
      'SELECT product_id FROM product_variants WHERE id = ?',
      [req.params.id]
    );
    
    if (variants.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    const productId = variants[0].product_id;
    
    // Delete the variant
    await transaction.execute(
      'DELETE FROM product_variants WHERE id = ?',
      [req.params.id]
    );
    
    // Update parent product stock
    await updateProductStock(transaction, productId);
    
    await transaction.commit();
    
    res.json({ success: true, message: 'Variant deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant' });
  } finally {
    if (transaction) await transaction.release();
  }
});

// Update stock for a variant
router.post('/variants/:id/update-stock', async (req, res) => {
  const transaction = await pool.getConnection();
  try {
    const { quantity, action = 'set' } = req.body; // action can be 'set', 'increment', or 'decrement'
    
    if (typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    await transaction.beginTransaction();
    
    // Get current variant
    const [variants] = await transaction.execute(
      'SELECT * FROM product_variants WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    
    if (variants.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Variant not found' });
    }
    
    const variant = variants[0];
    let newStock;
    
    // Calculate new stock based on action
    switch (action) {
      case 'increment':
        newStock = variant.stock + quantity;
        break;
      case 'decrement':
        newStock = Math.max(0, variant.stock - quantity);
        break;
      case 'set':
      default:
        newStock = Math.max(0, quantity);
    }
    
    // Update variant stock
    await transaction.execute(
      'UPDATE product_variants SET stock = ?, updated_at = NOW() WHERE id = ?',
      [newStock, req.params.id]
    );
    
    // Update parent product stock
    await updateProductStock(transaction, variant.product_id);
    
    await transaction.commit();
    
    res.json({ 
      success: true, 
      message: 'Stock updated successfully',
      stock: newStock
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
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
  
  // Update product stock
  await transaction.execute(
    'UPDATE products SET stock = ?, status = CASE WHEN ? > 0 THEN "active" ELSE "out_of_stock" END WHERE id = ?',
    [totalStock, totalStock, productId]
  );
  
  return totalStock;
}

module.exports = router;
