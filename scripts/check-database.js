#!/usr/bin/env node

const { pool, testConnection, initializeDatabase } = require('../api/config/database');

async function checkDatabase() {
  console.log('🔍 Checking database configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('- DATABASE_HOST:', process.env.DATABASE_HOST || 'Not set');
  console.log('- DATABASE_PORT:', process.env.DATABASE_PORT || 'Not set');
  console.log('- DATABASE_USER:', process.env.DATABASE_USER ? '✅ Set' : '❌ Not set');
  console.log('- DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('- DATABASE_NAME:', process.env.DATABASE_NAME || 'Not set');
  console.log('- DATABASE_SSL:', process.env.DATABASE_SSL || 'Not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('');
  
  // Test connection
  console.log('🔌 Testing database connection...');
  const connected = await testConnection();
  
  if (connected) {
    console.log('✅ Database connection successful!\n');
    
    // Initialize tables
    console.log('🗃️ Initializing database tables...');
    try {
      await initializeDatabase();
      console.log('✅ Database tables initialized successfully!\n');
      
      // Test basic operations
      console.log('🧪 Testing basic operations...');
      await testBasicOperations();
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
    }
  } else {
    console.log('❌ Database connection failed!\n');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Make sure you have created a MySQL service in Railway');
    console.log('2. Add DATABASE_URL variable: ${{MySQL.MYSQL_URL}}');
    console.log('3. Add DATABASE_SSL=true');
    console.log('4. Add DATABASE_SSL_REJECT_UNAUTHORIZED=false');
    console.log('5. Redeploy your application');
  }
  
  // Close pool
  if (pool) {
    await pool.end();
  }
}

async function testBasicOperations() {
  try {
    // Test account creation
    console.log('- Testing account creation...');
    await pool.execute(
      'INSERT IGNORE INTO accounts (phone, name, password) VALUES (?, ?, ?)',
      ['0123456789', 'Test User', 'test123']
    );
    console.log('  ✅ Account creation works');
    
    // Test promotion creation
    console.log('- Testing promotion creation...');
    await pool.execute(
      'INSERT INTO promotions (phone, percentage, description, usage_limit) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE percentage = VALUES(percentage)',
      ['0123456789', 15, 'Test Promotion', 3]
    );
    console.log('  ✅ Promotion creation works');
    
    // Test order creation
    console.log('- Testing order creation...');
    const orderId = `TEST-${Date.now()}`;
    await pool.execute(
      'INSERT INTO orders (id, phone, date, total, status, delivery_method, address, full_name, wilaya, city, shipping_cost, product_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, '0123456789', new Date().toISOString().slice(0, 10), 3000, 'processing', 'domicile', 'Test Address', 'Test User', 'Alger', 'Alger Centre', 500, 2500]
    );
    console.log('  ✅ Order creation works');
    
    // Test order item creation
    console.log('- Testing order item creation...');
    await pool.execute(
      'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
      [orderId, 1, 'Test Product', 2500, 1]
    );
    console.log('  ✅ Order item creation works');
    
    console.log('\n🎉 All database operations are working correctly!');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
  }
}

// Run the check
checkDatabase().catch(console.error);
