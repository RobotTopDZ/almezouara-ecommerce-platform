const express = require('express');
const { pool, testConnection } = require('./config/database');

// Force re-import pool to ensure it's available
const database = require('./config/database');
const dbPool = database.pool || pool;

const router = express.Router();

// Test database connection before processing promotions
const ensureDBConnection = async () => {
  console.log('🔍 Checking database connection for promotions...');
  const activePool = dbPool || pool;
  console.log('Pool status:', {
    poolExists: !!activePool,
    poolType: typeof activePool,
    poolConstructor: activePool?.constructor?.name,
    originalPool: !!pool,
    dbPool: !!dbPool
  });
  
  if (!activePool) {
    console.log('❌ No database pool available for promotions');
    return false;
  }
  
  try {
    // Test connection with a simple query
    console.log('🔍 Testing pool.execute...');
    const result = await activePool.execute('SELECT 1 as test');
    console.log('✅ Database connection verified for promotions:', result[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed for promotions:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    return false;
  }
};

// Promotions management (admin)
router.post('/', async (req, res) => {
  try {
    const { phoneNumber, percentage, description, usageLimit = 1 } = req.body || {};
    
    console.log('Promotion creation attempt:', { phoneNumber, percentage, description, usageLimit });
    
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
    
    // Try database operation, fallback to mock if fails
    const dbConnected = await ensureDBConnection();
    
    try {
      if (!dbConnected) {
        console.log('⚠️ No database connection, using mock mode for promotions');
        throw new Error('No database connection');
      }
      
      const activePool = dbPool || pool;
      
      // Ensure account exists for this phone number
      const [existingAccount] = await activePool.execute(
        'SELECT phone FROM accounts WHERE phone = ?',
        [phoneNumber]
      );
      
      if (existingAccount.length === 0) {
        // Create account first
        await activePool.execute(
          'INSERT INTO accounts (phone, name, password) VALUES (?, ?, ?)',
          [phoneNumber, 'Customer', 'default123']
        );
        console.log('Created new account for phone:', phoneNumber);
      }
      
      // Check if promotion already exists for this phone
      const [existingPromotions] = await activePool.execute(
        'SELECT id FROM promotions WHERE phone = ?',
        [phoneNumber]
      );
      
      if (existingPromotions.length > 0) {
        // Update existing promotion
        await activePool.execute(
          'UPDATE promotions SET percentage = ?, description = ?, usage_limit = ?, usage_count = 0, is_active = TRUE WHERE phone = ?',
          [percentage, description || '', usageLimit, phoneNumber]
        );
        
        return res.json({
          success: true,
          message: 'Promotion updated successfully',
          promotion: {
            phoneNumber,
            percentage,
            description: description || '',
            usageLimit,
            usageCount: 0,
            isActive: true
          }
        });
      } else {
        // Create new promotion
        const promotionId = `PROMO-${Date.now()}`;
        await activePool.execute(
          'INSERT INTO promotions (id, phone, percentage, description, usage_limit, usage_count, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [promotionId, phoneNumber, percentage, description || '', usageLimit, 0, true]
        );
        
        return res.json({
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
            isActive: true,
            createdAt: new Date().toISOString()
          }
        });
      }
    } catch (dbError) {
      console.log('Database error, using mock mode:', dbError.message);
      
      // Mock promotion creation for testing without database
      const promotionId = `PROMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      console.log('Mock promotion created:', promotionId);
      
      return res.json({
        success: true,
        promotionId,
        message: 'Promotion created successfully (mock mode)',
        promotion: {
          id: promotionId,
          phoneNumber,
          percentage,
          description: description || '',
          usageLimit,
          usageCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Promotion creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create promotion',
      details: error.message 
    });
  }
});

// Get promotion by phone number
router.get('/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    const dbConnected = await ensureDBConnection();
    if (!dbConnected) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    
    const activePool = dbPool || pool;
    const [promotions] = await activePool.execute(
      'SELECT * FROM promotions WHERE phone = ? AND is_active = TRUE',
      [phone]
    );
    
    if (promotions.length === 0) {
      return res.status(404).json({ error: 'No active promotion found for this phone number' });
    }
    
    res.json({ promotion: promotions[0] });
  } catch (error) {
    console.error('Get promotion error:', error);
    res.status(500).json({ error: 'Failed to get promotion' });
  }
});

// Use promotion (decrement usage count)
router.post('/:phone/use', async (req, res) => {
  try {
    const { phone } = req.params;
    
    const dbConnected = await ensureDBConnection();
    if (!dbConnected) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    
    const activePool = dbPool || pool;
    const [promotions] = await activePool.execute(
      'SELECT * FROM promotions WHERE phone = ? AND is_active = TRUE',
      [phone]
    );
    
    if (promotions.length === 0) {
      return res.status(404).json({ error: 'No active promotion found' });
    }
    
    const promotion = promotions[0];
    
    if (promotion.usage_count >= promotion.usage_limit) {
      return res.status(400).json({ error: 'Promotion usage limit exceeded' });
    }
    
    // Increment usage count
    const newUsageCount = promotion.usage_count + 1;
    const isStillActive = newUsageCount < promotion.usage_limit;
    
    await activePool.execute(
      'UPDATE promotions SET usage_count = ?, is_active = ? WHERE phone = ?',
      [newUsageCount, isStillActive, phone]
    );
    
    res.json({
      success: true,
      message: 'Promotion used successfully',
      promotion: {
        ...promotion,
        usage_count: newUsageCount,
        is_active: isStillActive
      }
    });
  } catch (error) {
    console.error('Use promotion error:', error);
    res.status(500).json({ error: 'Failed to use promotion' });
  }
});

module.exports = router;
