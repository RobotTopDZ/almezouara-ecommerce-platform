/**
 * Migration pour ajouter la colonne product_type à la table products
 */

const runMigration = async (pool) => {
  try {
    console.log('🔄 Running migration: Adding product_type column to products table');
    
    // Vérifier si la colonne existe déjà
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'product_type'
    `);
    
    // Si la colonne n'existe pas, l'ajouter
    if (columns.length === 0) {
      await pool.execute(`
        ALTER TABLE products 
        ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
      `);
      console.log('✅ Added product_type column to products table');
    } else {
      console.log('ℹ️ product_type column already exists in products table');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

module.exports = {
  runMigration
};