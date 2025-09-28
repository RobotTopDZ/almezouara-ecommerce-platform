// Fix product_variants table script
const mysql = require('mysql2/promise');
require('dotenv').config();

// Get database configuration
const getDbConfig = () => {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ''),
        port: Number(url.port || 3306),
        ssl: process.env.DATABASE_SSL === 'true' ? {
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
        } : false,
      };
    } catch (e) {
      console.error('Invalid DATABASE_URL:', e.message);
    }
  }

  return {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 3306,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false,
  };
};

async function fixProductVariantsTable() {
  console.log('🔧 Starting product_variants table fix...');
  
  let connection;
  try {
    // Create connection
    const dbConfig = getDbConfig();
    connection = await mysql.createConnection(dbConfig);
    console.log(`📊 Connected to database: ${dbConfig.host}/${dbConfig.database}`);
    
    // Check if table exists
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_variants'",
      [dbConfig.database]
    );
    
    if (tables.length > 0) {
      console.log('🔍 Table product_variants exists, checking structure...');
      
      // Drop and recreate the table
      await connection.execute('DROP TABLE IF EXISTS product_variants');
      console.log('🗑️ Dropped existing product_variants table');
    }
    
    // Create product_variants table with correct structure
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT PRIMARY KEY AUTO_INCREMENT,
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
    
    console.log('✅ Created product_variants table with correct structure');
    
    // Add indexes for better performance
    await connection.execute('CREATE INDEX idx_variant_product ON product_variants(product_id)');
    await connection.execute('CREATE INDEX idx_variant_sku ON product_variants(sku)');
    
    // Check if order_items table has variant_id column
    const [orderItemsColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'variant_id'",
      [dbConfig.database]
    );
    
    if (orderItemsColumns.length === 0) {
      console.log('🔧 Adding variant_id column to order_items table...');
      await connection.execute(`
        ALTER TABLE order_items 
        ADD COLUMN variant_id INT NULL AFTER product_id
      `);
      
      // Add foreign key
      try {
        await connection.execute(`
          ALTER TABLE order_items
          ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
        `);
      } catch (err) {
        console.log('⚠️ Could not add foreign key to order_items:', err.message);
      }
    }
    
    // Migrate existing data from products table
    console.log('🔄 Migrating existing product data to variants...');
    await connection.execute(`
      INSERT IGNORE INTO product_variants (product_id, color_name, color_value, size, stock)
      SELECT 
        p.id as product_id,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(p.colors, '$[0].name')),
          'Default'
        ) as color_name,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(p.colors, '$[0].value')),
          '#000000'
        ) as color_value,
        COALESCE(
          JSON_UNQUOTE(JSON_EXTRACT(p.sizes, '$[0]')),
          'One Size'
        ) as size,
        p.stock
      FROM products p
      WHERE JSON_VALID(p.colors) AND JSON_VALID(p.sizes)
    `);
    
    console.log('✅ Product variants table fix completed successfully');
  } catch (error) {
    console.error('❌ Error fixing product_variants table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the fix
fixProductVariantsTable().catch(console.error);