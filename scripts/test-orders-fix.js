#!/usr/bin/env node

const mysql = require('mysql2/promise');

async function testOrdersTable() {
  console.log('🔍 Testing orders table structure...');

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
    // Test if orders table exists and has correct structure
    const [columns] = await pool.execute('SHOW COLUMNS FROM orders');
    console.log('✅ Orders table exists');

    const hasItemsColumn = columns.some(col => col.Field === 'items');
    if (hasItemsColumn) {
      console.log('✅ Orders table has items column');

      // Test inserting a sample order
      const testOrder = {
        id: 'TEST-' + Date.now(),
        phone: '0123456789',
        full_name: 'Test User',
        wilaya: 'Alger',
        city: 'Alger',
        address: 'Test Address',
        delivery_method: 'domicile',
        items: JSON.stringify([{id: 1, name: 'Test Product', quantity: 1, price: 100}]),
        total: 100,
        status: 'pending'
      };

      await pool.execute(
        'INSERT INTO orders SET ?',
        testOrder
      );
      console.log('✅ Successfully inserted test order');

      // Clean up test order
      await pool.execute('DELETE FROM orders WHERE id = ?', [testOrder.id]);
      console.log('✅ Cleaned up test order');

    } else {
      console.log('❌ Orders table missing items column');
      return false;
    }

    console.log('🎉 Orders table is working correctly!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

testOrdersTable().catch(console.error);
