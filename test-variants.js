const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./almezouara.db');

console.log('🔍 Checking product_variants table...');

db.all('SELECT name FROM sqlite_master WHERE type="table" AND name="product_variants"', (err, tables) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  if (tables.length === 0) {
    console.log('❌ product_variants table does not exist');
    db.close();
    return;
  }
  
  console.log('✅ product_variants table exists');
  
  // Check table structure
  db.all('PRAGMA table_info(product_variants)', (err, columns) => {
    if (err) {
      console.error('Error getting table info:', err);
      db.close();
      return;
    }
    
    console.log('📊 Table structure:');
    columns.forEach(col => {
      console.log('  -', col.name, ':', col.type);
    });
    
    // Check if there are any variants
    db.all('SELECT COUNT(*) as count FROM product_variants', (err, result) => {
      if (err) {
        console.error('Error counting variants:', err);
      } else {
        console.log('📈 Total variants:', result[0].count);
      }
      
      // Check products with colors and sizes
      db.all('SELECT id, name, colors, sizes FROM products LIMIT 3', (err, products) => {
        if (err) {
          console.error('Error getting products:', err);
        } else {
          console.log('📦 Sample products:');
          products.forEach(product => {
            console.log(`  - ${product.name}: colors=${product.colors}, sizes=${product.sizes}`);
          });
        }
        
        db.close();
      });
    });
  });
});