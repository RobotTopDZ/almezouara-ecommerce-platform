const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration with flexible options for different providers (PlanetScale, Railway, etc.)
// Supports either discrete env vars or a single DATABASE_URL.
const useConnectionUrl = !!process.env.DATABASE_URL;

// SSL configuration:
// - If DATABASE_SSL === 'true', enable SSL (default is disabled)
// - If DATABASE_SSL_REJECT_UNAUTHORIZED === 'false', do not enforce CA verification (useful for some providers)
const sslEnabled = (process.env.DATABASE_SSL || '').toLowerCase() === 'true';
const rejectUnauthorized = (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true';

let baseConfig;
if (useConnectionUrl) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    // Example: mysql://USER:PASSWORD@HOST:PORT/DBNAME?ssl=true
    baseConfig = {
      host: url.hostname,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      port: Number(url.port || 3306),
      ssl: sslEnabled ? { rejectUnauthorized } : false,
    };
  } catch (e) {
    console.warn('Invalid DATABASE_URL, falling back to discrete variables:', e.message);
  }
}

if (!baseConfig) {
  baseConfig = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 3306,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    // MySQL 9.x compatibility
    authPlugins: {
      mysql_clear_password: () => () => Buffer.alloc(0)
    },
    // Handle MySQL 9.x authentication
    insecureAuth: false,
    supportBigNumbers: true,
    bigNumberStrings: true
  };
}

const dbConfig = {
  ...baseConfig,
  connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection (non-blocking)
const testConnection = async () => {
  try {
    // Add timeout to prevent hanging
    const connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Connected to: ${baseConfig.host}:${baseConfig.port}/${baseConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Database config (sanitized):', {
      host: baseConfig.host,
      port: baseConfig.port,
      database: baseConfig.database,
      user: baseConfig.user ? '***' : 'not set',
      ssl: baseConfig.ssl
    });
    return false;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create accounts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create promotions table (aligned with app usage)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        description TEXT,
        usage_limit INT DEFAULT 1,
        usage_count INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (phone) REFERENCES accounts(phone) ON DELETE CASCADE
      )
    `);

    // Create orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20),
        date DATE NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'processing',
        delivery_method ENUM('domicile', 'stopdesk') NOT NULL,
        address TEXT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        shipping_cost DECIMAL(10,2) NOT NULL,
        product_price DECIMAL(10,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        yalidine_tracking VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (phone) REFERENCES accounts(phone) ON DELETE SET NULL
      )
    `);

    // Create order_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
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
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Create stopdesk_fees table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stopdesk_fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom_desk VARCHAR(255) NOT NULL,
        commune VARCHAR(100) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        prix DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create domicile_fees table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS domicile_fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        commune VARCHAR(100) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        prix DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
