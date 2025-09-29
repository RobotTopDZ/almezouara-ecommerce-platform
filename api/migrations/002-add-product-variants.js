// Migration to add product_variants table
const { pool } = require('../config/database');

async function up() {
  console.log('Running migration: Add product_variants table');
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Create product_variants table if it doesn't exist
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
    const [orderItemsTable] = await connection.execute(
      "SHOW TABLES LIKE 'order_items'"
    );
    
    if (orderItemsTable.length > 0) {
      const [orderItemsColumns] = await connection.execute(
        "SHOW COLUMNS FROM order_items LIKE 'variant_id'"
      );
      
      if (orderItemsColumns.length === 0) {
        await connection.execute(`
          ALTER TABLE order_items 
          ADD COLUMN variant_id INT NULL AFTER product_id
        `);
        
        // Add foreign key constraint
        try {
          await connection.execute(`
            ALTER TABLE order_items
            ADD CONSTRAINT fk_order_items_variant
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) 
            ON DELETE SET NULL
          `);
        } catch (err) {
          console.log('Warning: Could not add foreign key to order_items. This is normal if the table does not exist yet.');
        }
      }
    }
    // Migrate existing data if any
    await pool.execute(`
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
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down(db) {
  try {
    // Drop foreign key from order_items first
    await pool.execute(`
      ALTER TABLE order_items
      DROP FOREIGN KEY IF EXISTS order_items_ibfk_2
    `);
    
    // Drop variant_id column from order_items
    await pool.execute(`
      ALTER TABLE order_items
      DROP COLUMN IF EXISTS variant_id
    `);
    
    // Drop product_variants table
    await pool.execute(`
      DROP TABLE IF EXISTS product_variants
    `);
    
    console.log('Migration reverted successfully');
  } catch (error) {
    console.error('Error reverting migration:', error);
    throw error;
  }
}

module.exports = { up, down };