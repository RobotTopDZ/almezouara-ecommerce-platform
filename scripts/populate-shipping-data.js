#!/usr/bin/env node

const { pool } = require('../api/config/database');

// Sample shipping data for Algeria
const domicileData = [
  // Alger
  { commune: 'Alger Centre', wilaya: 'Alger', prix: 400 },
  { commune: 'Bab Ezzouar', wilaya: 'Alger', prix: 450 },
  { commune: 'Birtouta', wilaya: 'Alger', prix: 500 },
  { commune: 'Dar El Beida', wilaya: 'Alger', prix: 450 },
  { commune: 'Draria', wilaya: 'Alger', prix: 500 },
  
  // Oran
  { commune: 'Oran', wilaya: 'Oran', prix: 600 },
  { commune: 'Es Senia', wilaya: 'Oran', prix: 650 },
  { commune: 'Bir El Djir', wilaya: 'Oran', prix: 650 },
  
  // Constantine
  { commune: 'Constantine', wilaya: 'Constantine', prix: 700 },
  { commune: 'El Khroub', wilaya: 'Constantine', prix: 750 },
  
  // Blida
  { commune: 'Blida', wilaya: 'Blida', prix: 450 },
  { commune: 'Boufarik', wilaya: 'Blida', prix: 500 },
  
  // Annaba
  { commune: 'Annaba', wilaya: 'Annaba', prix: 800 },
  { commune: 'El Bouni', wilaya: 'Annaba', prix: 850 },
  
  // Sétif
  { commune: 'Sétif', wilaya: 'Sétif', prix: 750 },
  { commune: 'El Eulma', wilaya: 'Sétif', prix: 800 },
  
  // Tizi Ouzou
  { commune: 'Tizi Ouzou', wilaya: 'Tizi Ouzou', prix: 550 },
  { commune: 'Azazga', wilaya: 'Tizi Ouzou', prix: 600 },
  
  // Béjaïa
  { commune: 'Béjaïa', wilaya: 'Béjaïa', prix: 650 },
  { commune: 'Akbou', wilaya: 'Béjaïa', prix: 700 },
  
  // Batna
  { commune: 'Batna', wilaya: 'Batna', prix: 800 },
  { commune: 'Barika', wilaya: 'Batna', prix: 850 },
  
  // Djelfa
  { commune: 'Djelfa', wilaya: 'Djelfa', prix: 900 },
  { commune: 'Messaad', wilaya: 'Djelfa', prix: 950 },
  
  // Jijel
  { commune: 'Jijel', wilaya: 'Jijel', prix: 700 },
  { commune: 'Taher', wilaya: 'Jijel', prix: 750 },
  
  // Mostaganem
  { commune: 'Mostaganem', wilaya: 'Mostaganem', prix: 650 },
  { commune: 'Relizane', wilaya: 'Relizane', prix: 700 },
  
  // Skikda
  { commune: 'Skikda', wilaya: 'Skikda', prix: 750 },
  { commune: 'Collo', wilaya: 'Skikda', prix: 800 }
];

const stopdeskData = [
  // Stopdesk locations (usually 200 DZD less than domicile)
  { nom_desk: 'Alger Centre Stopdesk', commune: 'Alger Centre', wilaya: 'Alger', prix: 200 },
  { nom_desk: 'Bab Ezzouar Stopdesk', commune: 'Bab Ezzouar', wilaya: 'Alger', prix: 250 },
  { nom_desk: 'Oran Centre Stopdesk', commune: 'Oran', wilaya: 'Oran', prix: 400 },
  { nom_desk: 'Constantine Centre Stopdesk', commune: 'Constantine', wilaya: 'Constantine', prix: 500 },
  { nom_desk: 'Blida Centre Stopdesk', commune: 'Blida', wilaya: 'Blida', prix: 250 },
  { nom_desk: 'Annaba Centre Stopdesk', commune: 'Annaba', wilaya: 'Annaba', prix: 600 },
  { nom_desk: 'Sétif Centre Stopdesk', commune: 'Sétif', wilaya: 'Sétif', prix: 550 },
  { nom_desk: 'Tizi Ouzou Centre Stopdesk', commune: 'Tizi Ouzou', wilaya: 'Tizi Ouzou', prix: 350 },
  { nom_desk: 'Béjaïa Centre Stopdesk', commune: 'Béjaïa', wilaya: 'Béjaïa', prix: 450 },
  { nom_desk: 'Batna Centre Stopdesk', commune: 'Batna', wilaya: 'Batna', prix: 600 }
];

async function populateShippingData() {
  try {
    console.log('🚀 Starting shipping data population...\n');
    
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
    for (const fee of domicileData) {
      await pool.execute(
        'INSERT INTO domicile_fees (commune, wilaya, prix) VALUES (?, ?, ?)',
        [fee.commune, fee.wilaya, fee.prix]
      );
    }
    console.log(`✅ Inserted ${domicileData.length} domicile fees\n`);
    
    // Insert stopdesk fees
    console.log('🏪 Inserting stopdesk fees...');
    for (const fee of stopdeskData) {
      await pool.execute(
        'INSERT INTO stopdesk_fees (nom_desk, commune, wilaya, prix) VALUES (?, ?, ?, ?)',
        [fee.nom_desk, fee.commune, fee.wilaya, fee.prix]
      );
    }
    console.log(`✅ Inserted ${stopdeskData.length} stopdesk fees\n`);
    
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
    
    console.log('\n🎉 Shipping data population completed successfully!');
    console.log('🚀 Your shipping fees API is now ready to use!');
    
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
