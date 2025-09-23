#!/usr/bin/env node

// Test script for Railway MySQL connection
// Based on the provided Railway MySQL info: caboose.proxy.rlwy.net:30411

const mysql = require('mysql2/promise');

async function testRailwayConnection() {
  console.log('🔍 Testing Railway MySQL Connection...\n');
  
  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  console.log('📋 Environment Check:');
  console.log('- DATABASE_URL:', databaseUrl ? '✅ Set' : '❌ Not set');
  console.log('- DATABASE_SSL:', process.env.DATABASE_SSL || 'Not set');
  console.log('- DATABASE_SSL_REJECT_UNAUTHORIZED:', process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || 'Not set');
  console.log('');
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL not found!');
    console.log('🔧 To fix this in Railway:');
    console.log('1. Go to your main service (almezouara-ecommerce-platform)');
    console.log('2. Click "Variables" tab');
    console.log('3. Add: DATABASE_URL=${{MySQL.MYSQL_URL}}');
    console.log('4. Add: DATABASE_SSL=true');
    console.log('5. Add: DATABASE_SSL_REJECT_UNAUTHORIZED=false');
    console.log('6. Save and redeploy');
    return;
  }
  
  // Parse DATABASE_URL
  let config;
  try {
    const url = new URL(databaseUrl);
    config = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: {
        rejectUnauthorized: false
      }
    };
    
    console.log('🔗 Connection Config:');
    console.log('- Host:', config.host);
    console.log('- Port:', config.port);
    console.log('- Database:', config.database);
    console.log('- User:', config.user);
    console.log('- SSL:', 'Enabled with rejectUnauthorized: false');
    console.log('');
    
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error.message);
    return;
  }
  
  // Test connection
  console.log('🔌 Testing connection...');
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!');
    
    // Test basic query
    console.log('🧪 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query successful:', rows[0]);
    
    // Test database creation
    console.log('🗃️ Testing database operations...');
    
    // Create test table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table creation successful');
    
    // Insert test data
    await connection.execute(
      'INSERT INTO connection_test (message) VALUES (?)',
      ['Railway connection test successful']
    );
    console.log('✅ Data insertion successful');
    
    // Read test data
    const [testData] = await connection.execute(
      'SELECT * FROM connection_test ORDER BY created_at DESC LIMIT 1'
    );
    console.log('✅ Data retrieval successful:', testData[0]);
    
    // Clean up test table
    await connection.execute('DROP TABLE connection_test');
    console.log('✅ Cleanup successful');
    
    console.log('\n🎉 All database operations working perfectly!');
    console.log('🚀 Your Railway MySQL database is ready for production!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    
    if (error.code === 'ENOTFOUND') {
      console.log('- Check if DATABASE_URL hostname is correct');
      console.log('- Verify Railway MySQL service is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('- Check DATABASE_URL credentials');
      console.log('- Verify ${{MySQL.MYSQL_URL}} is correctly set');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('- Check if port is correct (should be from Railway)');
      console.log('- Verify Railway MySQL service is accessible');
    } else {
      console.log('- Check all environment variables are set correctly');
      console.log('- Verify SSL settings: DATABASE_SSL=true, DATABASE_SSL_REJECT_UNAUTHORIZED=false');
    }
    
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testRailwayConnection().catch(console.error);
