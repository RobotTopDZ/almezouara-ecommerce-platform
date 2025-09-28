const db = require('../config/database');

async function up(db) {
  try {
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN product_type VARCHAR(255) DEFAULT 'simple' NOT NULL
    `);
    console.log('Migration 003-add-product-type-to-products executed successfully.');
  } catch (error) {
    console.error('Error executing migration 003-add-product-type-to-products:', error);
    throw error;
  }
}

async function down(db) {
  try {
    await db.query(`
      ALTER TABLE products 
      DROP COLUMN product_type
    `);
    console.log('Migration 003-add-product-type-to-products reverted successfully.');
  } catch (error) {
    console.error('Error reverting migration 003-add-product-type-to-products:', error);
    throw error;
  }
}

module.exports = { up, down };