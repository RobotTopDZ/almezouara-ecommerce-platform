const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function fixSQLiteSchema() {
  console.log('🔧 Fixing SQLite database schema...');
  
  const dbPath = path.join(__dirname, 'almezouara.db');
  
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('📊 Connected to SQLite database');
    
    // Drop the old orders table
    await db.exec('DROP TABLE IF EXISTS orders');
    console.log('🗑️ Dropped old orders table');
    
    // Create new orders table with correct schema
    await db.exec(`
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created new orders table with correct schema');
    
    // Also drop and recreate order_items table to ensure compatibility
    await db.exec('DROP TABLE IF EXISTS order_items');
    await db.exec(`
      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id VARCHAR(50) NOT NULL,
        product_id INTEGER NOT NULL,
        variant_id INTEGER,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        image VARCHAR(500),
        color VARCHAR(100),
        size VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
      )
    `);
    console.log('✅ Created new order_items table');
    
    // Verify the schema
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 Current tables:', tables.map(t => t.name));
    
    const orderColumns = await db.all("PRAGMA table_info(orders)");
    console.log('📋 Orders table columns:', orderColumns.map(c => `${c.name} (${c.type})`));
    
    await db.close();
    console.log('🎉 SQLite schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing SQLite schema:', error);
    throw error;
  }
}

fixSQLiteSchema().catch(console.error);