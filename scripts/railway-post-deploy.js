#!/usr/bin/env node

const { pool, testConnection, initializeDatabase } = require('../api/config/database');

async function postDeploy() {
  console.log('🚀 Railway Post-Deploy Script Starting...\n');
  
  try {
    // Wait a bit for the database to be ready
    console.log('⏳ Waiting for database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Database connection failed - skipping post-deploy tasks');
      process.exit(1);
    }
    
    console.log('✅ Database connected successfully');
    
    // Initialize database tables
    console.log('🗃️ Initializing database tables...');
    await initializeDatabase();
    console.log('✅ Database tables initialized');
    
    // Check if shipping data exists
    console.log('📦 Checking shipping data...');
    const [domicileCount] = await pool.execute('SELECT COUNT(*) as count FROM domicile_fees');
    const [stopdeskCount] = await pool.execute('SELECT COUNT(*) as count FROM stopdesk_fees');
    
    console.log(`📊 Current data: ${domicileCount[0].count} domicile fees, ${stopdeskCount[0].count} stopdesk fees`);
    
    // Populate shipping data if empty
    if (domicileCount[0].count === 0 || stopdeskCount[0].count === 0) {
      console.log('🔄 Populating shipping data from Excel files...');
      
      try {
        // Import real data
        const { completeDomicileFees } = require('../src/data/completeDomicileData.js');
        const { stopdeskFees } = require('../src/data/shippingData.js');
        
        console.log(`📋 Found ${completeDomicileFees.length} domicile fees and ${stopdeskFees.length} stopdesk fees in Excel data`);
        
        // Clear existing data
        await pool.execute('DELETE FROM domicile_fees');
        await pool.execute('DELETE FROM stopdesk_fees');
        console.log('🧹 Cleared existing shipping data');
        
        // Insert domicile fees
        console.log('📦 Inserting domicile fees...');
        let domicileInserted = 0;
        for (const fee of completeDomicileFees) {
          try {
            await pool.execute(
              'INSERT INTO domicile_fees (commune, wilaya, prix) VALUES (?, ?, ?)',
              [fee.commune, fee.wilaya, fee.prix]
            );
            domicileInserted++;
            
            if (domicileInserted % 200 === 0) {
              console.log(`   Progress: ${domicileInserted}/${completeDomicileFees.length} domicile fees...`);
            }
          } catch (error) {
            console.warn(`   Warning: Failed to insert domicile fee for ${fee.commune}: ${error.message}`);
          }
        }
        
        // Insert stopdesk fees
        console.log('🏪 Inserting stopdesk fees...');
        let stopdeskInserted = 0;
        for (const fee of stopdeskFees) {
          try {
            await pool.execute(
              'INSERT INTO stopdesk_fees (nom_desk, commune, wilaya, prix) VALUES (?, ?, ?, ?)',
              [fee.nomDesk, fee.commune, fee.wilaya, fee.prix]
            );
            stopdeskInserted++;
            
            if (stopdeskInserted % 50 === 0) {
              console.log(`   Progress: ${stopdeskInserted}/${stopdeskFees.length} stopdesk fees...`);
            }
          } catch (error) {
            console.warn(`   Warning: Failed to insert stopdesk fee for ${fee.nomDesk}: ${error.message}`);
          }
        }
        
        console.log(`✅ Shipping data populated: ${domicileInserted} domicile + ${stopdeskInserted} stopdesk fees`);
        
      } catch (importError) {
        console.error('❌ Failed to import shipping data:', importError.message);
        console.log('ℹ️ Shipping data will use fallback values');
      }
    } else {
      console.log('✅ Shipping data already exists, skipping population');
    }
    
    // Create default admin account if not exists
    console.log('👤 Checking admin account...');
    try {
      const [adminExists] = await pool.execute(
        'SELECT phone FROM accounts WHERE phone = ?',
        ['admin']
      );
      
      if (adminExists.length === 0) {
        await pool.execute(
          'INSERT INTO accounts (phone, name, password) VALUES (?, ?, ?)',
          ['admin', 'Administrator', 'admin123']
        );
        console.log('✅ Default admin account created');
      } else {
        console.log('✅ Admin account already exists');
      }
    } catch (error) {
      console.warn('⚠️ Could not create admin account:', error.message);
    }
    
    // Fix product_variants table
    console.log('\n🔧 Fixing product_variants table...');
    try {
      // Check if product_variants table exists with correct structure
      // Use SQLite compatible query if using SQLite
      const isSQLite = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sqlite');
      const [variantsTable] = await pool.execute(
        isSQLite 
          ? "SELECT name FROM sqlite_master WHERE type='table' AND name='product_variants'"
          : "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_variants'",
        isSQLite ? [] : [process.env.DATABASE_NAME || 'railway']
      );
      
      if (variantsTable.length === 0) {
        console.log('⚠️ product_variants table does not exist, creating it...');
        
        // Create product_variants table
        await pool.execute(`
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
        
        // Add indexes for better performance
        await pool.execute('CREATE INDEX idx_variant_product ON product_variants(product_id)');
        await pool.execute('CREATE INDEX idx_variant_sku ON product_variants(sku)');
        
        console.log('✅ product_variants table created successfully');
      } else {
        console.log('✅ product_variants table already exists');
      }
      
      // Check if order_items table has variant_id column
      const [orderItemsColumns] = await pool.execute(
        isSQLite
          ? "PRAGMA table_info(order_items)"
          : "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'variant_id'",
        isSQLite ? [] : [process.env.DATABASE_NAME || 'railway']
      );
      
      if ((isSQLite && !orderItemsColumns.some(col => col.name === 'variant_id')) || 
          (!isSQLite && orderItemsColumns.length === 0)) {
        console.log('⚠️ variant_id column missing from order_items, adding it...');
        await pool.execute(`
          ALTER TABLE order_items 
          ADD COLUMN variant_id INT NULL AFTER product_id
        `);
        
        // Add foreign key
        try {
          await pool.execute(`
            ALTER TABLE order_items
            ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
          `);
        } catch (err) {
          console.log('⚠️ Could not add foreign key to order_items:', err.message);
        }
        
        console.log('✅ variant_id column added to order_items');
      } else {
        console.log('✅ variant_id column already exists in order_items');
      }
    } catch (error) {
      console.error('❌ Error fixing product_variants table:', error.message);
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    try {
      const isSQLite = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sqlite');
      
      // Use try/catch for each table check to avoid stopping on first error
      try {
        const [finalDomicile] = await pool.execute('SELECT COUNT(*) as count FROM domicile_fees');
        console.log(`✅ domicile_fees table: ${finalDomicile[0].count} records`);
      } catch (err) {
        console.warn(`⚠️ Could not verify domicile_fees table: ${err.message}`);
      }
      
      try {
        const [finalStopdesk] = await pool.execute('SELECT COUNT(*) as count FROM stopdesk_fees');
        console.log(`✅ stopdesk_fees table: ${finalStopdesk[0].count} records`);
      } catch (err) {
        console.warn(`⚠️ Could not verify stopdesk_fees table: ${err.message}`);
      }
      
      try {
        const [finalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`✅ orders table: ${finalOrders[0].count} records`);
      } catch (err) {
        console.warn(`⚠️ Could not verify orders table: ${err.message}`);
      }
      
      try {
        const [finalPromotions] = await pool.execute('SELECT COUNT(*) as count FROM promotions');
        console.log(`✅ promotions table: ${finalPromotions[0].count} records`);
      } catch (err) {
        console.warn(`⚠️ Could not verify promotions table: ${err.message}`);
      }
      
      try {
        const [finalAccounts] = await pool.execute('SELECT COUNT(*) as count FROM accounts');
        console.log(`✅ accounts table: ${finalAccounts[0].count} records`);
      } catch (err) {
        console.warn(`⚠️ Could not verify accounts table: ${err.message}`);
      }
    
      // Check product_variants count
      let finalVariants = [{count: 0}];
      try {
        [finalVariants] = await pool.execute('SELECT COUNT(*) as count FROM product_variants');
      } catch (err) {
        console.log('⚠️ Could not count product_variants:', err.message);
      }
      
      console.log('📊 Database Summary:');
      console.log(`   - Domicile fees: ${finalDomicile[0].count}`);
      console.log(`   - Stopdesk fees: ${finalStopdesk[0].count}`);
      console.log(`   - Orders: ${finalOrders[0].count}`);
      console.log(`   - Promotions: ${finalPromotions[0].count}`);
      console.log(`   - Accounts: ${finalAccounts[0].count}`);
      console.log(`   - Product variants: ${finalVariants[0].count}`);
      
      console.log('\n🎉 Post-deploy completed successfully!');
      console.log('🚀 Your e-commerce is ready for production!');
    } catch (error) {
      console.error('❌ Final verification failed:', error.message);
    }
  } catch (error) {
    console.error('❌ Post-deploy failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run post-deploy
postDeploy().catch(error => {
  console.error('❌ Post-deploy script failed:', error);
  process.exit(1);
});
