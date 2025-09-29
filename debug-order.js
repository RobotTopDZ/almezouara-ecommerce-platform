const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function debugOrder() {
  try {
    const dbPath = path.join(__dirname, 'almezouara.db');
    console.log('Database path:', dbPath);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('✅ Connected to SQLite database');
    
    // Check orders table schema
    const orderColumns = await db.all("PRAGMA table_info(orders)");
    console.log('📋 Orders table columns:', orderColumns.map(c => `${c.name} (${c.type})`));
    
    // Test simple insert
    const orderId = `TEST-${Date.now()}`;
    console.log('Testing order insert with ID:', orderId);
    
    try {
      await db.run(`
        INSERT INTO orders (id, phone, full_name, wilaya, city, address, delivery_method, total, discount_percentage, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderId, '0555123456', 'Test Customer', 'Alger', 'Alger Centre', '123 Test Street', 'domicile', 5400, 0, 'pending']);
      
      console.log('✅ Order inserted successfully');
      
      // Verify the insert
      const insertedOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
      console.log('📦 Inserted order:', insertedOrder);
      
      // Clean up
      await db.run('DELETE FROM orders WHERE id = ?', [orderId]);
      console.log('🧹 Test order cleaned up');
      
    } catch (insertError) {
      console.error('❌ Insert error:', insertError);
    }
    
    await db.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugOrder();