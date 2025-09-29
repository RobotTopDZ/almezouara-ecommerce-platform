const { pool } = require('./api/config/database');

async function debugAPIOrder() {
  try {
    console.log('🔧 Testing API order flow...');
    
    const orderId = `API-TEST-${Date.now()}`;
    const phoneNumber = '0555123456';
    const fullName = 'Test Customer';
    const wilaya = 'Alger';
    const city = 'Alger Centre';
    const address = '123 Test Street';
    const deliveryMethod = 'domicile';
    const total = 5400;
    const discountPercentage = 0;
    
    console.log('Testing order insert via pool.execute...');
    
    try {
      await pool.execute(`
        INSERT INTO orders (id, phone, full_name, wilaya, city, address, delivery_method, total, discount_percentage, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderId, phoneNumber, fullName, wilaya, city, address, deliveryMethod, total, discountPercentage, 'pending']);
      
      console.log('✅ Order inserted successfully via pool.execute');
      
      // Test getting connection
      console.log('Testing connection.execute...');
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        console.log('✅ Transaction started');
        
        // Test order item insert
        await connection.execute(`
          INSERT INTO order_items (order_id, product_id, variant_id, product_name, price, quantity, image, color, size)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, 1, 1, 'Test Product', 2500, 2, 'test.jpg', 'Rouge', 'S']);
        
        console.log('✅ Order item inserted successfully');
        
        await connection.commit();
        console.log('✅ Transaction committed');
        
      } catch (connError) {
        console.error('❌ Connection error:', connError);
        await connection.rollback();
      } finally {
        await connection.release();
      }
      
      // Clean up
      await pool.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
      console.log('🧹 Test data cleaned up');
      
    } catch (insertError) {
      console.error('❌ Insert error:', insertError);
      console.error('Error details:', insertError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAPIOrder();