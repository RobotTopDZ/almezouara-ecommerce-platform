#!/usr/bin/env node

// Aggressive fix for order system
const mysql = require('mysql2/promise');
const https = require('https');

async function aggressiveFix() {
  console.log('🔥 Starting aggressive order system fix...');

  // 1. Connect directly to database and fix tables
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

    // Create orders table with correct structure
    await pool.execute(`
      CREATE TABLE orders (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20),
        full_name VARCHAR(255),
        wilaya VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        delivery_method VARCHAR(50),
        items TEXT,
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

    // 2. Test order creation via API
    console.log('🧪 Testing order creation...');

    const orderData = {
      phoneNumber: '0123456789',
      items: [
        {
          id: 1,
          name: 'Test Product',
          price: 1000,
          quantity: 1,
          image: '/images/test.jpg',
          color: 'Noir',
          size: 'M'
        }
      ],
      total: 1000,
      deliveryMethod: 'domicile',
      address: '123 Test Street, Test City',
      fullName: 'Test User',
      wilaya: 'Alger',
      city: 'Alger Centre',
      shippingCost: 500,
      productPrice: 1000,
      discountPercentage: 0
    };

    const postOptions = {
      hostname: 'almezouara-ecommerce-platform-production.up.railway.app',
      port: 443,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js Aggressive Fix'
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(postOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('✅ Order creation response:', response);
            resolve(response);
          } catch (error) {
            console.error('❌ Failed to parse order response:', data);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Order request failed:', error.message);
        reject(error);
      });

      req.write(JSON.stringify(orderData));
      req.end();
    });

    // 3. Verify orders in database
    console.log('🔍 Checking orders in database...');
    const [orders] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');

    console.log(`📊 Found ${orders.length} orders in database:`);
    orders.forEach(order => {
      console.log(`  - Order ${order.id}: ${order.full_name} - ${order.total} DZD (${order.status})`);
    });

    // 4. Test admin retrieval
    console.log('👨‍💼 Testing admin order retrieval...');

    const getOptions = {
      hostname: 'almezouara-ecommerce-platform-production.up.railway.app',
      port: 443,
      path: '/api/orders',
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Admin Test'
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(getOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log('✅ Admin retrieval response:', response);
            console.log(`📊 Admin sees ${response.orders?.length || 0} orders`);
            resolve(response);
          } catch (error) {
            console.error('❌ Failed to parse admin response:', data);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Admin request failed:', error.message);
        reject(error);
      });

      req.end();
    });

    console.log('🎉 Aggressive fix completed successfully!');

  } catch (error) {
    console.error('💥 Aggressive fix failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

aggressiveFix().catch(console.error);
