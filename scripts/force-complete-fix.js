#!/usr/bin/env node

// Force complete database fix and disable mock mode
const mysql = require('mysql2/promise');

async function forceCompleteFix() {
  console.log('🔥 FORCE COMPLETE DATABASE FIX - NO MOCK MODE');

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
    console.log('💀 DROPPING ALL EXISTING TABLES...');

    // Drop all existing tables
    const tablesToDrop = ['orders', 'order_items'];
    for (const table of tablesToDrop) {
      try {
        await pool.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Dropped ${table} table`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${table}: ${error.message}`);
      }
    }

    console.log('🏗️ CREATING CORRECT TABLES...');

    // Create orders table with EXACT structure (NO date column)
    await pool.execute(`
      CREATE TABLE orders (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20),
        full_name VARCHAR(255) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        delivery_method VARCHAR(50) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        discount_percentage INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        yalidine_tracking VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created orders table with correct structure');

    // Create order_items table
    await pool.execute(`
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        image VARCHAR(500),
        color VARCHAR(100),
        size VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created order_items table with foreign key');

    // Verify tables
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📋 Current tables:', tables.map(t => Object.values(t)[0]));

    // Show exact structure
    const [columns] = await pool.execute('DESCRIBE orders');
    console.log('📋 Orders table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default || 'NO DEFAULT'}`);
    });

    // Test REAL order creation (no mock)
    console.log('🧪 Testing REAL order creation (no mock mode)...');

    const testOrderId = `REAL-${Date.now()}`;
    await pool.execute(`
      INSERT INTO orders (id, phone, full_name, wilaya, city, address, delivery_method, total, discount_percentage, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [testOrderId, '0123456789', 'Real Test User', 'Alger', 'Alger Centre', '123 Real Street', 'domicile', 2000, 0, 'pending']);

    await pool.execute(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image, color, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [testOrderId, 1, 'Real Test Product', 2000, 1, '/images/real.jpg', 'Noir', 'M']);

    console.log('✅ REAL order created successfully in database');

    // Verify real order
    const [realOrders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    const [realItems] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [testOrderId]);

    console.log('📊 Real order verification:');
    console.log('  Orders:', realOrders.length);
    console.log('  Items:', realItems.length);
    console.log('  Order details:', realOrders[0]);

    console.log('🎉 COMPLETE DATABASE FIX - NO MOCK MODE - READY FOR PRODUCTION!');

  } catch (error) {
    console.error('💥 Database fix failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

forceCompleteFix().catch(console.error);
