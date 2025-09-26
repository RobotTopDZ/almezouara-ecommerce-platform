#!/usr/bin/env node

// Force fix for order system
const https = require('https');

async function forceFixOrders() {
  console.log('🔧 Forcing complete order system fix...');

  const options = {
    hostname: 'almezouara-ecommerce-platform-production.up.railway.app',
    port: 443,
    path: '/api/emergency-fix-orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Node.js Force Fix'
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
          console.log('✅ Emergency fix response:', response);
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

async function testOrderCreation() {
  console.log('🧪 Testing order creation...');

  const orderData = {
    phoneNumber: '0123456789',
    items: [
      {
        id: 1,
        name: 'Test Product',
        price: 1000,
        quantity: 1,
        image: '/images/test.jpg',
        color: 'Noir',
        size: 'M'
      }
    ],
    total: 1000,
    deliveryMethod: 'domicile',
    address: '123 Test Street, Test City',
    fullName: 'Test User',
    wilaya: 'Alger',
    city: 'Alger Centre',
    shippingCost: 500,
    productPrice: 1000,
    discountPercentage: 0
  };

  const options = {
    hostname: 'almezouara-ecommerce-platform-production.up.railway.app',
    port: 443,
    path: '/api/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Node.js Order Test'
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
          console.log('✅ Order creation response:', response);
          resolve(response);
        } catch (error) {
          console.error('❌ Failed to parse order response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Order request failed:', error.message);
      reject(error);
    });

    req.write(JSON.stringify(orderData));
    req.end();
  });
}

async function testOrderRetrieval() {
  console.log('📋 Testing order retrieval...');

  const options = {
    hostname: 'almezouara-ecommerce-platform-production.up.railway.app',
    port: 443,
    path: '/api/orders',
    method: 'GET',
    headers: {
      'User-Agent': 'Node.js Order Retrieval Test'
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
          console.log('✅ Order retrieval response:', response);
          console.log(`📊 Found ${response.orders?.length || 0} orders`);
          resolve(response);
        } catch (error) {
          console.error('❌ Failed to parse retrieval response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Retrieval request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🚀 Starting complete order system test...\n');

    // 1. Force fix
    await forceFixOrders();
    console.log('');

    // 2. Test order creation
    await testOrderCreation();
    console.log('');

    // 3. Test order retrieval
    await testOrderRetrieval();
    console.log('');

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

runAllTests();
