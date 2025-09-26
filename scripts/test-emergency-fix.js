#!/usr/bin/env node

// Script to test the emergency database fix endpoint
const https = require('https');

async function testEmergencyFix() {
  console.log('🔧 Testing emergency database fix endpoint...');

  const options = {
    hostname: 'almezouara-ecommerce-platform-production.up.railway.app',
    port: 443,
    path: '/api/emergency-fix-orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Node.js Emergency Fix Test'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Response:', response);
          resolve(response);
        } catch (error) {
          console.error('❌ Failed to parse response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(JSON.stringify({}));
    req.end();
  });
}

// Run the test
testEmergencyFix()
  .then(() => {
    console.log('🎉 Emergency fix test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Emergency fix test failed:', error.message);
    process.exit(1);
  });
