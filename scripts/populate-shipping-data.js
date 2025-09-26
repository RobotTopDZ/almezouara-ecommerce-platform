#!/usr/bin/env node

const { pool } = require('../api/config/database');
const { completeDomicileFees } = require('../src/data/completeDomicileData.js');
const { stopdeskFees } = require('../src/data/shippingData.js');

async function populateShippingData() {
  try {
    console.log('🚀 Starting shipping data population with complete Algerian data...\n');
    
    if (!pool) {
      console.error('❌ Database not connected');
      return;
    }
    
    // Clear existing data
    console.log('🧹 Clearing existing shipping data...');
    await pool.execute('DELETE FROM domicile_fees');
    await pool.execute('DELETE FROM stopdesk_fees');
    console.log('✅ Existing data cleared\n');
    
    // Insert domicile fees
    console.log('📦 Inserting domicile fees...');
    for (const fee of completeDomicileFees) {
      await pool.execute(
        'INSERT INTO domicile_fees (commune, wilaya, prix) VALUES (?, ?, ?)',
        [fee.commune, fee.wilaya, fee.prix]
      );
    }
    console.log(`✅ Inserted ${completeDomicileFees.length} domicile fees\n`);
    
    // Insert stopdesk fees
    console.log('🏪 Inserting stopdesk fees...');
    for (const fee of stopdeskFees) {
      await pool.execute(
        'INSERT INTO stopdesk_fees (nom_desk, commune, wilaya, prix) VALUES (?, ?, ?, ?)',
        [fee.nomDesk, fee.commune, fee.wilaya, fee.prix]
      );
    }
    console.log(`✅ Inserted ${stopdeskFees.length} stopdesk fees\n`);
    
    // Verify data
    console.log('🔍 Verifying inserted data...');
    const [domicileCount] = await pool.execute('SELECT COUNT(*) as count FROM domicile_fees');
    const [stopdeskCount] = await pool.execute('SELECT COUNT(*) as count FROM stopdesk_fees');
    
    console.log(`📊 Domicile fees in database: ${domicileCount[0].count}`);
    console.log(`📊 Stopdesk fees in database: ${stopdeskCount[0].count}`);
    
    // Show sample data
    console.log('\n📋 Sample domicile fees:');
    const [sampleDomicile] = await pool.execute('SELECT * FROM domicile_fees LIMIT 5');
    sampleDomicile.forEach(fee => {
      console.log(`  - ${fee.commune}, ${fee.wilaya}: ${fee.prix} DZD`);
    });
    
    console.log('\n🏪 Sample stopdesk fees:');
    const [sampleStopdesk] = await pool.execute('SELECT * FROM stopdesk_fees LIMIT 5');
    sampleStopdesk.forEach(fee => {
      console.log(`  - ${fee.nom_desk}: ${fee.prix} DZD`);
    });
    
    console.log('\n🎉 Complete shipping data population completed successfully!');
    console.log('🚀 Your shipping fees API now has data for all 48 Algerian wilayas!');
    
  } catch (error) {
    console.error('❌ Error populating shipping data:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the population
populateShippingData().catch(console.error);
