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

// Log connection details (without password)
console.log('🔧 Database connection details:');
console.log(`- Host: ${connectionConfig.host}`);
console.log(`- Port: ${connectionConfig.port}`);
console.log(`- Database: ${connectionConfig.database}`);
console.log(`- SSL: ${connectionConfig.ssl ? 'Enabled' : 'Disabled'}`);

let pool;
let usingSQLite = false;

// Initialize SQLite fallback immediately since MySQL is not available
console.log('🔄 Initializing SQLite database...');
try {
  const sqliteConfig = require('./database-sqlite');
  pool = sqliteConfig.pool;
  usingSQLite = true;
  console.log('✅ SQLite database initialized');
} catch (sqliteError) {
  console.error('❌ SQLite initialization failed:', sqliteError.message);
  
  // Try MySQL as fallback
  try {
    pool = mysql.createPool(connectionConfig);
    console.log('✅ MySQL fallback initialized');
  } catch (mysqlError) {
    console.error('❌ Both SQLite and MySQL failed:', mysqlError.message);
    throw new Error('Both SQLite and MySQL database connections failed');
  }
}

const testConnection = async () => {
  try {
    if (usingSQLite) {
      const sqliteConfig = require('./database-sqlite');
      return await sqliteConfig.testConnection();
    } else {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ MySQL database connection test successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    
    // Try SQLite fallback if MySQL fails
    if (!usingSQLite) {
      console.log('🔄 MySQL failed, trying SQLite fallback...');
      try {
        const sqliteConfig = require('./database-sqlite');
        pool = sqliteConfig.pool;
        usingSQLite = true;
        return await sqliteConfig.testConnection();
      } catch (sqliteError) {
        console.error('❌ SQLite fallback also failed:', sqliteError.message);
        return false;
      }
    }
    return false;
  }
};

const createTablesIfNotExist = async () => {
  try {
    if (usingSQLite) {
      const sqliteConfig = require('./database-sqlite');
      return await sqliteConfig.initializeDatabase();
    }
    
    // MySQL table creation logic
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INT,
        image_url VARCHAR(500),
        stock INT DEFAULT 0,
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color_name VARCHAR(100) NOT NULL,
        color_value VARCHAR(7) DEFAULT '#000000',
        size VARCHAR(50) NOT NULL,
        stock INT DEFAULT 0,
        sku VARCHAR(100),
        barcode VARCHAR(100),
        price_adjustment DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_variant (product_id, color_name, size)
      )
    `);

    console.log('✅ MySQL tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

const runMigrations = async () => {
  try {
    console.log('🔄 Running database migrations...');
    
    // Add any migration logic here
    
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('🔄 MySQL connection failed, attempting SQLite fallback...');
      
      // Force SQLite fallback
      try {
        const sqliteConfig = require('./database-sqlite');
        pool = sqliteConfig.pool;
        usingSQLite = true;
        console.log('✅ SQLite fallback initialized successfully');
        
        // Test SQLite connection
        const sqliteConnected = await sqliteConfig.testConnection();
        if (!sqliteConnected) {
          throw new Error('SQLite connection also failed');
        }
      } catch (sqliteError) {
        console.error('❌ SQLite fallback failed:', sqliteError.message);
        throw new Error('Both MySQL and SQLite database connections failed');
      }
    }
    
    await createTablesIfNotExist();
    await runMigrations();
    
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  createTablesIfNotExist,
  runMigrations,
  initializeDatabase,
  usingSQLite
};
