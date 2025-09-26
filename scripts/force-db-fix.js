#!/usr/bin/env node

// Force database structure fix
const mysql = require('mysql2/promise');

async function forceDatabaseFix() {
  console.log('🔥 Forcing database structure fix...');

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
    console.log('🗑️ Dropping existing tables...');

    // Drop tables if they exist
    const tablesToDrop = ['orders', 'order_items'];
    for (const table of tablesToDrop) {
      try {
        await pool.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✅ Dropped ${table} table`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${table}: ${error.message}`);
      }
    }

    console.log('🏗️ Creating correct tables...');

    // Create orders table with correct structure (NO items column)
    await pool.execute(`
      CREATE TABLE orders (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20),
        full_name VARCHAR(255),
        wilaya VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        delivery_method VARCHAR(50),
        total DECIMAL(10,2),
        discount_percentage INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        yalidine_tracking VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created orders table');

    // Create order_items table
    await pool.execute(`
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        image VARCHAR(500),
        color VARCHAR(100),
        size VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Created order_items table');

    // Verify tables
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📋 Current tables:', tables.map(t => Object.values(t)[0]));

    // Test order creation
    console.log('🧪 Testing order creation...');

    const testOrderId = `TEST-${Date.now()}`;
    await pool.execute(`
      INSERT INTO orders (id, phone, full_name, wilaya, city, address, delivery_method, total, discount_percentage, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [testOrderId, '0123456789', 'Test User', 'Alger', 'Alger Centre', '123 Test Street', 'domicile', 1000, 0, 'pending']);

    await pool.execute(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image, color, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [testOrderId, 1, 'Test Product', 1000, 1, '/images/test.jpg', 'Noir', 'M']);

    console.log('✅ Test order created successfully');

    // Verify test order
    const [testOrders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    const [testItems] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [testOrderId]);

    console.log('📊 Test order verification:');
    console.log('  Orders:', testOrders.length);
    console.log('  Items:', testItems.length);

    console.log('🎉 Database structure fix completed successfully!');

  } catch (error) {
    console.error('💥 Database fix failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

forceDatabaseFix().catch(console.error);
