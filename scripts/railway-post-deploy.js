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
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const [finalDomicile] = await pool.execute('SELECT COUNT(*) as count FROM domicile_fees');
    const [finalStopdesk] = await pool.execute('SELECT COUNT(*) as count FROM stopdesk_fees');
    const [finalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [finalPromotions] = await pool.execute('SELECT COUNT(*) as count FROM promotions');
    const [finalAccounts] = await pool.execute('SELECT COUNT(*) as count FROM accounts');
    
    console.log('📊 Database Summary:');
    console.log(`   - Domicile fees: ${finalDomicile[0].count}`);
    console.log(`   - Stopdesk fees: ${finalStopdesk[0].count}`);
    console.log(`   - Orders: ${finalOrders[0].count}`);
    console.log(`   - Promotions: ${finalPromotions[0].count}`);
    console.log(`   - Accounts: ${finalAccounts[0].count}`);
    
    console.log('\n🎉 Post-deploy completed successfully!');
    console.log('🚀 Your e-commerce is ready for production!');
    
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
