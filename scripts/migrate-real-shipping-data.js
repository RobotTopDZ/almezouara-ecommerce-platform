#!/usr/bin/env node

const { pool } = require('../api/config/database');

// Import your real shipping data from Excel files
const { completeDomicileFees } = require('../src/data/completeDomicileData.js');
const { stopdeskFees } = require('../src/data/shippingData.js');

async function migrateRealShippingData() {
  try {
    console.log('🚀 Starting migration of REAL shipping data from Excel files...\n');
    
    if (!pool) {
      console.error('❌ Database not connected');
      return;
    }
    
    // Clear existing data
    console.log('🧹 Clearing existing shipping data...');
    await pool.execute('DELETE FROM domicile_fees');
    await pool.execute('DELETE FROM stopdesk_fees');
    console.log('✅ Existing data cleared\n');
    
    // Migrate domicile fees from completeDomicileData.js
    console.log('📦 Migrating domicile fees from Excel data...');
    console.log(`   Total domicile entries to migrate: ${completeDomicileFees.length}`);
    
    let domicileCount = 0;
    for (const fee of completeDomicileFees) {
      try {
        await pool.execute(
          'INSERT INTO domicile_fees (commune, wilaya, prix) VALUES (?, ?, ?)',
          [fee.commune, fee.wilaya, fee.prix]
        );
        domicileCount++;
        
        // Progress indicator
        if (domicileCount % 100 === 0) {
          console.log(`   Migrated ${domicileCount}/${completeDomicileFees.length} domicile fees...`);
        }
      } catch (error) {
        console.error(`   Error migrating domicile fee for ${fee.commune}, ${fee.wilaya}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${domicileCount} domicile fees from Excel data\n`);
    
    // Migrate stopdesk fees from shippingData.js
    console.log('🏪 Migrating stopdesk fees from Excel data...');
    console.log(`   Total stopdesk entries to migrate: ${stopdeskFees.length}`);
    
    let stopdeskCount = 0;
    for (const fee of stopdeskFees) {
      try {
        await pool.execute(
          'INSERT INTO stopdesk_fees (nom_desk, commune, wilaya, prix) VALUES (?, ?, ?, ?)',
          [fee.nomDesk, fee.commune, fee.wilaya, fee.prix]
        );
        stopdeskCount++;
        
        // Progress indicator
        if (stopdeskCount % 20 === 0) {
          console.log(`   Migrated ${stopdeskCount}/${stopdeskFees.length} stopdesk fees...`);
        }
      } catch (error) {
        console.error(`   Error migrating stopdesk fee for ${fee.nomDesk}:`, error.message);
      }
    }
    console.log(`✅ Migrated ${stopdeskCount} stopdesk fees from Excel data\n`);
    
    // Verify migration
    console.log('🔍 Verifying migrated data...');
    const [domicileVerify] = await pool.execute('SELECT COUNT(*) as count FROM domicile_fees');
    const [stopdeskVerify] = await pool.execute('SELECT COUNT(*) as count FROM stopdesk_fees');
    
    console.log(`📊 Domicile fees in database: ${domicileVerify[0].count}`);
    console.log(`📊 Stopdesk fees in database: ${stopdeskVerify[0].count}`);
    
    // Show sample data by wilaya
    console.log('\n📋 Sample migrated data by wilaya:');
    const [sampleByWilaya] = await pool.execute(`
      SELECT wilaya, COUNT(*) as domicile_count 
      FROM domicile_fees 
      GROUP BY wilaya 
      ORDER BY domicile_count DESC 
      LIMIT 10
    `);
    
    sampleByWilaya.forEach(row => {
      console.log(`  - ${row.wilaya}: ${row.domicile_count} communes`);
    });
    
    console.log('\n🏪 Sample stopdesk locations:');
    const [sampleStopdesk] = await pool.execute('SELECT nom_desk, commune, wilaya, prix FROM stopdesk_fees LIMIT 10');
    sampleStopdesk.forEach(fee => {
      console.log(`  - ${fee.nom_desk} (${fee.commune}, ${fee.wilaya}): ${fee.prix} DZD`);
    });
    
    // Test API compatibility
    console.log('\n🧪 Testing API compatibility...');
    
    // Test getting wilayas
    const [wilayas] = await pool.execute('SELECT DISTINCT wilaya FROM domicile_fees ORDER BY wilaya');
    console.log(`✅ Available wilayas: ${wilayas.length} (${wilayas.slice(0, 5).map(w => w.wilaya).join(', ')}...)`);
    
    // Test getting cities for Alger
    const [algerCities] = await pool.execute('SELECT commune, prix FROM domicile_fees WHERE wilaya = "Alger" ORDER BY prix');
    if (algerCities.length > 0) {
      console.log(`✅ Alger cities: ${algerCities.length} communes`);
      console.log(`   Price range: ${algerCities[0].prix} - ${algerCities[algerCities.length-1].prix} DZD`);
    }
    
    // Test stopdesk for Alger
    const [algerStopdesk] = await pool.execute('SELECT nom_desk, prix FROM stopdesk_fees WHERE wilaya = "Alger"');
    if (algerStopdesk.length > 0) {
      console.log(`✅ Alger stopdesk locations: ${algerStopdesk.length} desks`);
    }
    
    console.log('\n🎉 Real shipping data migration completed successfully!');
    console.log('🚀 Your shipping fees API now uses your actual Excel data!');
    console.log('\n📝 Summary:');
    console.log(`   - ${domicileCount} domicile fees migrated`);
    console.log(`   - ${stopdeskCount} stopdesk fees migrated`);
    console.log(`   - ${wilayas.length} wilayas covered`);
    console.log('   - All data from your original Excel files');
    
  } catch (error) {
    console.error('❌ Error migrating real shipping data:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the migration
migrateRealShippingData().catch(console.error);
