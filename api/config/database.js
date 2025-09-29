const mysql = require('mysql2/promise');
require('dotenv').config();

// Log environment variables for debugging
console.log('🔍 Database Configuration:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '*** (set)' : 'Not set');
console.log('- MYSQL_URL:', process.env.MYSQL_URL ? '*** (set)' : 'Not set');
console.log('- DATABASE_HOST:', process.env.DATABASE_HOST || 'Not set');

// Database configuration with flexible options for different providers (Railway, etc.)
// Supports either MYSQL_URL, DATABASE_URL, or discrete environment variables
let connectionConfig;

// Try MYSQL_URL first (Railway default)
if (process.env.MYSQL_URL) {
  try {
    const url = new URL(process.env.MYSQL_URL);
    connectionConfig = {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      port: Number(url.port || 3306),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
      queueLimit: 0,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 60000,
      // MySQL 9.x compatibility
      authPlugins: {
        mysql_clear_password: () => () => Buffer.alloc(0)
      },
      // Additional MySQL options
      insecureAuth: false,
      supportBigNumbers: true,
      bigNumberStrings: true,
      multipleStatements: true,
      dateStrings: true,
      timezone: 'local'
    };
    console.log('🔧 Using MYSQL_URL for database connection');
  } catch (e) {
    console.error('❌ Error parsing MYSQL_URL:', e.message);
  }
} 
// Fall back to DATABASE_URL
else if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    connectionConfig = {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      port: Number(url.port || 3306),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
      queueLimit: 0,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      timeout: 60000,
      // MySQL 9.x compatibility
      authPlugins: {
        mysql_clear_password: () => () => Buffer.alloc(0)
      },
      // Additional MySQL options
      insecureAuth: false,
      supportBigNumbers: true,
      bigNumberStrings: true,
      multipleStatements: true,
      dateStrings: true,
      timezone: 'local'
    };
    console.log('🔧 Using DATABASE_URL for database connection');
  } catch (e) {
    console.error('❌ Error parsing DATABASE_URL:', e.message);
  }
}

// Fall back to individual environment variables
if (!connectionConfig) {
  connectionConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'almezouara',
    ssl: process.env.DATABASE_SSL === 'true' ? { 
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' 
    } : false,
    waitForConnections: true,
    connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
    queueLimit: 0,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 60000,
    // MySQL 9.x compatibility
    authPlugins: {
      mysql_clear_password: () => () => Buffer.alloc(0)
    },
    // Additional MySQL options
    insecureAuth: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: true,
    dateStrings: true,
    timezone: 'local'
  };
  console.log('🔧 Using individual environment variables for database connection');
}

// Log the final configuration (without sensitive data)
console.log('🔧 Database connection details:');
console.log(`- Host: ${connectionConfig.host}`);
console.log(`- Port: ${connectionConfig.port}`);
console.log(`- Database: ${connectionConfig.database}`);
console.log(`- SSL: ${connectionConfig.ssl ? 'Enabled' : 'Disabled'}`);

// Create the connection pool
const pool = mysql.createPool(connectionConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to the database');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

// Helper function to create tables if they don't exist
const createTablesIfNotExist = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        category_id INT,
        images JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color_name VARCHAR(100) NOT NULL,
        color_value VARCHAR(7) NOT NULL DEFAULT '#000000',
        size VARCHAR(50) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        price_adjustment DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_variant (product_id, color_name, size)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Database tables verified/created');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Helper function to run migrations
const runMigrations = async () => {
  console.log('🔄 Running database migrations...');
  const connection = await pool.getConnection();
  try {
    // Check if migrations table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'migrations'"
    );
    
    if (tables.length === 0) {
      console.log('Creating migrations table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Add your migrations here as needed
    
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    // Test the connection first
    await testConnection();
    
    // Initialize tables if they don't exist
    await createTablesIfNotExist();
    
    // Run any pending migrations
    await runMigrations();
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    return false;
  }
};

// Create the pool with the connection configuration
let pool;
if (!pool) {
  pool = mysql.createPool(connectionConfig);
}

// Export the pool and functions
module.exports = {
  pool,
  testConnection,
  createTablesIfNotExist,
  runMigrations,
  initializeDatabase
};
