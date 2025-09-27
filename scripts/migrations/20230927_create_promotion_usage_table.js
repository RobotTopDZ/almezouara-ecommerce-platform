const mysql = require('mysql2/promise');
require('dotenv').config();

const MYSQL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'almezouara',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function runMigration() {
  let connection;
  try {
    // Create a connection to the database
    connection = await mysql.createConnection(MYSQL_CONFIG);
    
    console.log('🔧 Starting database migration...');
    
    // Create promotion_usage table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS promotion_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        promotion_id VARCHAR(50) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        order_id VARCHAR(50) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_promotion_usage (promotion_id, user_id, order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    // Add usage_count column to promotions table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE promotions 
        ADD COLUMN IF NOT EXISTS usage_count INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS usage_limit INT NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
      `);
    } catch (error) {
      console.log('ℹ️ Some columns might already exist, continuing...');
    }
    
    console.log('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
