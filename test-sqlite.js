const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function testSQLite() {
  try {
    const dbPath = path.join(__dirname, 'almezouara.db');
    console.log('Database path:', dbPath);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Test basic connection
    console.log('✅ Connected to SQLite database');
    
    // Check tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 Tables:', tables.map(t => t.name));
    
    // Check products table
    try {
      const products = await db.all('SELECT * FROM products LIMIT 5');
      console.log('📦 Products count:', products.length);
      console.log('📦 Sample products:', products);
    } catch (error) {
      console.log('❌ Error querying products:', error.message);
    }
    
    // Check categories table
    try {
      const categories = await db.all('SELECT * FROM categories LIMIT 5');
      console.log('📂 Categories count:', categories.length);
      console.log('📂 Sample categories:', categories);
    } catch (error) {
      console.log('❌ Error querying categories:', error.message);
    }
    
    await db.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ SQLite test failed:', error);
  }
}

testSQLite();