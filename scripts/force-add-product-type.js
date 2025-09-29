#!/usr/bin/env node

const { pool } = require('../api/config/database');

async function forceAddProductTypeColumn() {
  console.log('🔄 FORCE ADDING product_type column to products table...');
  
  try {
    // Forcer l'ajout de la colonne sans vérification préalable
    try {
      await pool.execute(`
        ALTER TABLE products 
        ADD COLUMN product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
      `);
      console.log('✅ Successfully added product_type column to products table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ product_type column already exists in products table');
      } else {
        // Si l'erreur est différente, on la log mais on continue
        console.error(`⚠️ Error adding column: ${error.message}`);
      }
    }
    
    // Vérifier que la colonne existe maintenant
    try {
      const [result] = await pool.execute(`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'product_type'
      `);
      
      if (result[0].count > 0) {
        console.log('✅ Verified product_type column exists in products table');
      } else {
        console.error('❌ product_type column still does not exist in products table');
        
        // Tentative alternative avec une syntaxe différente
        console.log('🔄 Trying alternative approach...');
        await pool.execute(`
          ALTER TABLE products 
          ADD product_type VARCHAR(50) DEFAULT 'simple' NOT NULL
        `);
        console.log('✅ Added product_type column using alternative syntax');
      }
    } catch (error) {
      console.error(`❌ Error verifying column: ${error.message}`);
    }
    
    // Vérifier la structure de la table products
    try {
      const [columns] = await pool.execute('DESCRIBE products');
      console.log('📋 Current products table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT '${col.Default}'` : ''}`);
      });
    } catch (error) {
      console.error(`❌ Error describing table: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await pool.end();
    console.log('✅ Database connection closed');
  }
}

// Exécuter le script
forceAddProductTypeColumn().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});