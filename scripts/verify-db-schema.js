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

async function verifySchema() {
  let connection;
  try {
    connection = await mysql.createConnection(MYSQL_CONFIG);
    
    console.log('🔍 Verifying database schema...');
    
    // Check if promotion_usage table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'promotion_usage'"
    );
    
    if (tables.length === 0) {
      console.log('❌ promotion_usage table is missing');
      process.exit(1);
    }
    
    console.log('✅ promotion_usage table exists');
    
    // Check if promotions table has required columns
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM promotions LIKE 'usage_count'"
    );
    
    if (columns.length === 0) {
      console.log('❌ usage_count column is missing from promotions table');
      process.exit(1);
    }
    
    console.log('✅ promotions table has all required columns');
    
    console.log('\n🎉 Database schema verification completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error verifying database schema:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

// Run the verification
verifySchema();
