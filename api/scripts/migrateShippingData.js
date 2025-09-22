const { pool } = require('../config/database');
const path = require('path');
const { pathToFileURL } = require('url');

const migrateShippingData = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Dynamically import ESM shipping data from the frontend only when migration is enabled
    const shippingDataPath = path.resolve(__dirname, '../../src/data/shippingData.js');
    const { stopdeskFees, domicileFees } = await import(pathToFileURL(shippingDataPath).href);

    console.log('🔄 Migrating stopdesk fees...');
    for (const fee of stopdeskFees) {
      await connection.execute(
        'INSERT IGNORE INTO stopdesk_fees (nom_desk, commune, wilaya, prix) VALUES (?, ?, ?, ?)',
        [fee.nomDesk, fee.commune, fee.wilaya, fee.prix]
      );
    }
    console.log(`✅ Migrated ${stopdeskFees.length} stopdesk fees`);

    console.log('🔄 Migrating domicile fees...');
    for (const fee of domicileFees) {
      await connection.execute(
        'INSERT IGNORE INTO domicile_fees (commune, wilaya, prix) VALUES (?, ?, ?)',
        [fee.commune, fee.wilaya, fee.prix]
      );
    }
    console.log(`✅ Migrated ${domicileFees.length} domicile fees`);

    connection.release();
    console.log('✅ Shipping data migration completed successfully');
  } catch (error) {
    console.error('❌ Shipping data migration failed:', error.message);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateShippingData()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateShippingData };

