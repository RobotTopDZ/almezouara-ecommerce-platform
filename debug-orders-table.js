const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the same database path as the application
const dbPath = path.join(__dirname, 'almezouara.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking orders table in:', dbPath);

// Check if orders table exists and has data
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'", (err, tables) => {
  if (err) {
    console.error('Error checking tables:', err);
    return;
  }
  
  console.log('📋 Tables found:', tables);
  
  if (tables.length > 0) {
    // Check orders table schema
    db.all("PRAGMA table_info(orders)", (err, schema) => {
      if (err) {
        console.error('Error getting schema:', err);
        return;
      }
      
      console.log('📊 Orders table schema:');
      schema.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
      
      // Check if there are any orders
      db.all("SELECT COUNT(*) as count FROM orders", (err, count) => {
        if (err) {
          console.error('Error counting orders:', err);
          return;
        }
        
        console.log(`📈 Total orders in database: ${count[0].count}`);
        
        if (count[0].count > 0) {
          // Show recent orders
          db.all("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5", (err, orders) => {
            if (err) {
              console.error('Error fetching orders:', err);
              return;
            }
            
            console.log('📋 Recent orders:');
            orders.forEach(order => {
              console.log(`  - ID: ${order.id}, Phone: ${order.phone}, Total: ${order.total}, Status: ${order.status}`);
            });
            
            // Check order_items table
            db.all("SELECT COUNT(*) as count FROM order_items", (err, itemCount) => {
              if (err) {
                console.error('Error counting order items:', err);
                return;
              }
              
              console.log(`📦 Total order items: ${itemCount[0].count}`);
              
              if (itemCount[0].count > 0) {
                db.all("SELECT * FROM order_items LIMIT 5", (err, items) => {
                  if (err) {
                    console.error('Error fetching order items:', err);
                    return;
                  }
                  
                  console.log('📦 Recent order items:');
                  items.forEach(item => {
                    console.log(`  - Order: ${item.order_id}, Product: ${item.product_name}, Qty: ${item.quantity}`);
                  });
                  
                  db.close();
                });
              } else {
                db.close();
              }
            });
          });
        } else {
          db.close();
        }
      });
    });
  } else {
    console.log('❌ Orders table not found!');
    db.close();
  }
});