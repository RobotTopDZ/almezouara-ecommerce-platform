// Migration to add product_variants table
const mysql = require('mysql2/promise');
const config = require('../config/config');

async function migrate() {
  console.log('Running migration: Add product_variants table');
  
  try {
    // Create connection
    const connection = await mysql.createConnection(config.db);
    
    // Check if table exists
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_variants'",
      [config.db.database]
    );
    
    if (tables.length > 0) {
      console.log('Table product_variants already exists, skipping migration');
      await connection.end();
      return;
    }
    
    // Create product_variants table
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
    
    // Add variant_id to order_items if it doesn't exist
    const [orderItemsColumns] = await connection.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'variant_id'",
      [config.db.database]
    );
    
    if (orderItemsColumns.length === 0) {
      await connection.execute(`
        ALTER TABLE order_items 
        ADD COLUMN variant_id INT NULL AFTER product_id
      `);
      
      // Add foreign key if order_items table exists
      try {
        await connection.execute(`
          ALTER TABLE order_items
          ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
        `);
      } catch (err) {
        console.log('Warning: Could not add foreign key to order_items. This is normal if the table does not exist yet.');
      }
    }
    
    // Add indexes for better performance
    await connection.execute(`CREATE INDEX idx_variant_product ON product_variants(product_id)`);
    await connection.execute(`CREATE INDEX idx_variant_sku ON product_variants(sku)`);
    
    // Migrate existing data if any
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
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE pv.id IS NULL AND JSON_VALID(p.colors) AND JSON_VALID(p.sizes)
    `);
    
    console.log('Migration completed successfully');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

module.exports = { migrate };