const express = require('express');
const { pool } = require('./config/database');

const router = express.Router();

// Promotions management (admin)
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, percentage, description, usageLimit = 1 } = req.body || {};
    
    // Validate required fields
    if (!phoneNumber || phoneNumber.trim() === '') {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    if (percentage === undefined || percentage === null || isNaN(percentage)) {
      return res.status(400).json({ error: 'Valid percentage is required' });
    }
    
    if (usageLimit < 1) {
      return res.status(400).json({ error: 'Usage limit must be at least 1' });
    }

    // Ensure account exists for this phone number
    const [existingAccount] = await pool.execute(
      'SELECT phone FROM accounts WHERE phone = ?',
      [phoneNumber]
    );
    
    if (existingAccount.length === 0) {
      // Create account first
      await pool.execute(
        'INSERT INTO accounts (phone, name, password) VALUES (?, ?, ?)',
        [phoneNumber, 'Customer', '']
      );
    }
    
    // Check if promotion already exists for this phone
    const [existingPromotions] = await pool.execute(
      'SELECT id FROM promotions WHERE phone = ?',
      [phoneNumber]
    );
    
    if (existingPromotions.length > 0) {
      // Update existing promotion
      await pool.execute(
        'UPDATE promotions SET percentage = ?, description = ?, usage_limit = ?, usage_count = 0, is_active = TRUE WHERE phone = ?',
        [percentage, description || '', usageLimit, phoneNumber]
      );
    } else {
      // Create new promotion
      await pool.execute(
        'INSERT INTO promotions (phone, percentage, description, usage_limit, usage_count, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [phoneNumber, percentage, description || '', usageLimit, 0, true]
      );
    }

    const [promotions] = await pool.execute(
      'SELECT percentage, description, usage_limit, usage_count, is_active FROM promotions WHERE phone = ?',
      [phoneNumber]
    );
    res.json({ ok: true, promotions });
  } catch (error) {
    console.error('Promotion creation error:', error);
    res.status(500).json({ error: 'Failed to create promotion: ' + error.message });
  }
});

// Get promotions for a phone number
router.get('/:phone', async (req, res) => {
  try {
    const [promotions] = await pool.execute(
      'SELECT percentage, description, usage_limit, usage_count, is_active FROM promotions WHERE phone = ? AND is_active = TRUE',
      [req.params.phone]
    );

    res.json({ promotions });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ error: 'Failed to get promotions' });
  }
});

// Use promotion endpoint
router.post('/use', async (req, res) => {
  try {
    const { phoneNumber } = req.body || {};
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Get active promotion for this phone
    const [promotions] = await pool.execute(
      'SELECT id, percentage, description, usage_limit, usage_count FROM promotions WHERE phone = ? AND is_active = TRUE',
      [phoneNumber]
    );

    if (promotions.length === 0) {
      return res.json({ ok: false, message: 'No active promotion found' });
    }

    const promotion = promotions[0];
    
    // Check if promotion can still be used
    if (promotion.usage_count >= promotion.usage_limit) {
      return res.json({ ok: false, message: 'Promotion usage limit reached' });
    }

    // Increment usage count
    await pool.execute(
      'UPDATE promotions SET usage_count = usage_count + 1 WHERE id = ?',
      [promotion.id]
    );

    // Check if promotion is now fully used
    const newUsageCount = promotion.usage_count + 1;
    if (newUsageCount >= promotion.usage_limit) {
      await pool.execute(
        'UPDATE promotions SET is_active = FALSE WHERE id = ?',
        [promotion.id]
      );
    }
    res.json({ 
      ok: true, 
      promotion: {
        percentage: promotion.percentage,
        description: promotion.description,
        remainingUses: promotion.usage_limit - newUsageCount
      }
    });
  } catch (error) {
    console.error('Use promotion error:', error);
    res.status(500).json({ error: 'Failed to use promotion: ' + error.message });
  }
});

module.exports = router;
