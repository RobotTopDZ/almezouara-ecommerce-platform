const mysql = require('mysql2/promise');

async function fixOrdersTable() {
  console.log('🔧 Running database migration: Fix orders table');
  
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    // Vérifier si la table orders existe
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'orders'"
    );

    if (tables.length === 0) {
      console.log('ℹ️ Creating orders table...');
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
    } else {
      // Vérifier si la colonne items existe
      const [columns] = await pool.execute(
        "SHOW COLUMNS FROM orders LIKE 'items'"
      );

      if (columns.length === 0) {
        console.log('ℹ️ Adding missing columns to orders table...');
        try {
          await pool.execute('ALTER TABLE orders ADD COLUMN items TEXT AFTER delivery_method');
          console.log('✅ Added items column to orders table');
        } catch (error) {
          console.error('❌ Error adding columns:', error.message);
        }
      } else {
        console.log('✅ Orders table is up to date');
      }
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await pool.end();
  }
}

module.exports = fixOrdersTable;
