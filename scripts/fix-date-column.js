#!/usr/bin/env node

// Fix MySQL date column issue
const mysql = require('mysql2/promise');

async function fixDateColumn() {
  console.log('🔧 Fixing MySQL date column issue...');

  const dbConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  };

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    Object.assign(dbConfig, {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace(/^\//, '')
    });
    dbConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = mysql.createPool(dbConfig);

  try {
    console.log('🔍 Checking current table structure...');

    // Check current orders table structure
    const [columns] = await pool.execute('DESCRIBE orders');
    console.log('📋 Current orders table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default || 'NO DEFAULT'}`);
    });

    // Check if there's a date column that's causing issues
    const dateColumn = columns.find(col => col.Field === 'date');
    if (dateColumn) {
      console.log('⚠️ Found problematic date column, fixing...');

      // Drop the date column
      await pool.execute('ALTER TABLE orders DROP COLUMN date');
      console.log('✅ Dropped problematic date column');
    }

    // Ensure created_at has proper default
    const createdAtColumn = columns.find(col => col.Field === 'created_at');
    if (!createdAtColumn) {
      console.log('⚠️ Missing created_at column, adding...');
      await pool.execute('ALTER TABLE orders ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ Added created_at column with default');
    } else if (createdAtColumn.Default !== 'CURRENT_TIMESTAMP') {
      console.log('⚠️ Fixing created_at column default...');
      await pool.execute('ALTER TABLE orders MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ Fixed created_at column default');
    }

    // Test order creation
    console.log('🧪 Testing order creation...');

    const testOrderId = `TEST-${Date.now()}`;
    await pool.execute(`
      INSERT INTO orders (id, phone, full_name, wilaya, city, address, delivery_method, total, discount_percentage, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [testOrderId, '0123456789', 'Test User', 'Alger', 'Alger Centre', '123 Test Street', 'domicile', 1000, 0, 'pending']);

    console.log('✅ Test order created successfully');

    // Verify test order
    const [testOrders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    console.log(`📊 Test order verification: ${testOrders.length} orders found`);

    console.log('🎉 Date column issue fixed successfully!');

  } catch (error) {
    console.error('💥 Database fix failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixDateColumn().catch(console.error);
