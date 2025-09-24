#!/usr/bin/env node

const { pool } = require('../api/config/database');

async function fixPromotionsTable() {
  console.log('🔧 Fixing promotions table schema...');
  
  try {
    if (!pool) {
      console.error('❌ No database connection');
      process.exit(1);
    }
    
    // Check if table exists and get current schema
    console.log('🔍 Checking current table schema...');
    const [columns] = await pool.execute('DESCRIBE promotions');
    console.log('Current columns:', columns.map(c => `${c.Field}: ${c.Type}`));
    
    // Check if id column is INT
    const idColumn = columns.find(c => c.Field === 'id');
    if (idColumn && idColumn.Type.includes('int')) {
      console.log('⚠️  ID column is INT, need to fix it');
      
      // Drop and recreate table with correct schema
      console.log('🗑️  Dropping existing promotions table...');
      await pool.execute('DROP TABLE IF EXISTS promotions');
      
      console.log('🏗️  Creating new promotions table with VARCHAR id...');
      await pool.execute(`
        CREATE TABLE promotions (
          id VARCHAR(50) PRIMARY KEY,
          phone VARCHAR(20) NOT NULL,
          percentage DECIMAL(5,2) NOT NULL,
          description TEXT,
          usage_limit INT DEFAULT 1,
          usage_count INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_phone (phone)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Promotions table fixed successfully');
    } else {
      console.log('✅ Promotions table schema is already correct');
    }
    
    // Verify the fix
    console.log('🔍 Verifying table schema...');
    const [newColumns] = await pool.execute('DESCRIBE promotions');
    const newIdColumn = newColumns.find(c => c.Field === 'id');
    console.log(`ID column type: ${newIdColumn.Type}`);
    
    if (newIdColumn.Type.includes('varchar')) {
      console.log('🎉 Table schema fixed successfully!');
    } else {
      console.log('❌ Table schema fix failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error fixing promotions table:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

fixPromotionsTable();
