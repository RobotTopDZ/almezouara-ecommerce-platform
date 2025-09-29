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
const createTablesIfNotExist = async () => {
  const connection = await pool.getConnection();
  try {
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

    // Create product_variants table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color VARCHAR(100),
        size VARCHAR(50),
        stock INT NOT NULL DEFAULT 0,
        price_adjustment DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Database table creation failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Run database migrations
const runMigrations = async () => {
  console.log('🔄 Running database migrations...');
  try {
    // Check if migrations table exists
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'migrations'"
    );
    
    if (tables.length === 0) {
      console.log('Creating migrations table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Get completed migrations
    const [completedMigrations] = await pool.query(
      'SELECT name FROM migrations'
    );
    
    const completedMigrationNames = new Set(
      completedMigrations.map(m => m.name)
    );
    
    // Define migrations to run
    const migrations = [
      {
        name: '001_initial_schema',
        run: async () => {
          // This is handled by createTablesIfNotExist
          return true;
        }
      },
      {
        name: '002_add_product_variants',
        run: async () => {
          const { up } = require('../migrations/002-add-product-variants');
          await up();
          return true;
        }
      }
    ];
    
    // Run pending migrations
    for (const migration of migrations) {
      if (!completedMigrationNames.has(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        await migration.run();
        await pool.query(
          'INSERT INTO migrations (name) VALUES (?)',
          [migration.name]
        );
        console.log(`✅ Migration ${migration.name} completed`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

const initializeDatabase = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Initializing database tables...');
    await connection.beginTransaction();
    
    try {
      // Create tables if they don't exist
      await createTablesIfNotExist();
      
      // Run migrations
      await runMigrations();
      
      // Check if product_variants table exists
      const [tables] = await connection.query(
        "SHOW TABLES LIKE 'product_variants'"
      );
      
      if (tables.length === 0) {
        console.log('🔄 Creating product_variants table...');
        await connection.execute(`
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
        
        // Add variant_id to order_items if it doesn't exist
        const [columns] = await connection.query(
          "SHOW COLUMNS FROM order_items LIKE 'variant_id'"
        );
        
        if (columns.length === 0) {
          console.log('🔄 Adding variant_id to order_items...');
          await connection.execute(`
            ALTER TABLE order_items 
            ADD COLUMN variant_id INT NULL AFTER product_id,
            ADD CONSTRAINT fk_order_items_variant
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) 
            ON DELETE SET NULL
          `);
        }
        
        console.log('✅ Product variants table and columns created');
      }
      
      await connection.commit();
      console.log('✅ Database initialization completed');
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
