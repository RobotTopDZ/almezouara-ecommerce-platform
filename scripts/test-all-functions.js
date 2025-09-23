#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://almezouara-ecommerce-platform-production.up.railway.app';
const TEST_PHONE = '0555123456';

async function testAllFunctions() {
  console.log('🧪 Testing all Almezouara e-commerce functions...\n');
  console.log(`🌐 Base URL: ${BASE_URL}\n`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Health check
  totalTests++;
  console.log('1️⃣ Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      console.log('✅ Health check passed');
      passedTests++;
    } else {
      console.log('❌ Health check failed');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  console.log('');
  
  // Test 2: Database connection
  totalTests++;
  console.log('2️⃣ Testing database connection...');
  try {
    const response = await axios.get(`${BASE_URL}/debug/database`);
    if (response.data.database && response.data.database.connected) {
      console.log('✅ Database connection passed');
      passedTests++;
    } else {
      console.log('❌ Database not connected');
    }
  } catch (error) {
    console.log('❌ Database connection test failed:', error.message);
  }
  console.log('');
  
  // Test 3: Create order
  totalTests++;
  console.log('3️⃣ Testing order creation...');
  try {
    const orderData = {
      phoneNumber: TEST_PHONE,
      items: [
        {
          id: 1,
          name: 'Robe Test',
          price: 2500,
          quantity: 1,
          image: '/images/test.jpg',
          color: 'Noir',
          size: 'M'
        }
      ],
      total: 3000,
      deliveryMethod: 'domicile',
      address: '123 Rue Test, Alger',
      fullName: 'Test Client',
      wilaya: 'Alger',
      city: 'Alger Centre',
      shippingCost: 400,
      productPrice: 2500
    };
    
    const response = await axios.post(`${BASE_URL}/api/orders`, orderData);
    if (response.data.success && response.data.orderId) {
      console.log('✅ Order creation passed');
      console.log(`   Order ID: ${response.data.orderId}`);
      passedTests++;
    } else {
      console.log('❌ Order creation failed');
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Order creation failed:', error.response?.data || error.message);
  }
  console.log('');
  
  // Test 4: Create promotion
  totalTests++;
  console.log('4️⃣ Testing promotion creation...');
  try {
    const promotionData = {
      phoneNumber: TEST_PHONE,
      percentage: 15,
      description: 'Promotion Test Automatique',
      usageLimit: 3
    };
    
    const response = await axios.post(`${BASE_URL}/api/promotions`, promotionData);
    if (response.data.success && response.data.promotionId) {
      console.log('✅ Promotion creation passed');
      console.log(`   Promotion ID: ${response.data.promotionId}`);
      passedTests++;
    } else {
      console.log('❌ Promotion creation failed');
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Promotion creation failed:', error.response?.data || error.message);
  }
  console.log('');
  
  // Test 5: Get promotion
  totalTests++;
  console.log('5️⃣ Testing promotion retrieval...');
  try {
    const response = await axios.get(`${BASE_URL}/api/promotions/${TEST_PHONE}`);
    if (response.data.promotion) {
      console.log('✅ Promotion retrieval passed');
      console.log(`   Percentage: ${response.data.promotion.percentage}%`);
      passedTests++;
    } else {
      console.log('❌ Promotion retrieval failed');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️ No promotion found (this is normal if none created yet)');
    } else {
      console.log('❌ Promotion retrieval failed:', error.response?.data || error.message);
    }
  }
  console.log('');
  
  // Test 6: Get shipping fees (all wilayas)
  totalTests++;
  console.log('6️⃣ Testing shipping fees (all wilayas)...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees`);
    if (response.data.success && response.data.wilayas && response.data.wilayas.length > 0) {
      console.log('✅ Shipping fees (wilayas) passed');
      console.log(`   Available wilayas: ${response.data.wilayas.length}`);
      passedTests++;
    } else {
      console.log('❌ Shipping fees (wilayas) failed');
    }
  } catch (error) {
    console.log('❌ Shipping fees (wilayas) failed:', error.response?.data || error.message);
  }
  console.log('');
  
  // Test 7: Get shipping fees for Alger
  totalTests++;
  console.log('7️⃣ Testing shipping fees for Alger...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees?wilaya=Alger`);
    if (response.data.success && response.data.cities && response.data.cities.length > 0) {
      console.log('✅ Shipping fees (Alger cities) passed');
      console.log(`   Cities in Alger: ${response.data.cities.length}`);
      passedTests++;
    } else {
      console.log('❌ Shipping fees (Alger cities) failed');
    }
  } catch (error) {
    console.log('❌ Shipping fees (Alger cities) failed:', error.response?.data || error.message);
  }
  console.log('');
  
  // Test 8: Get specific shipping fee
  totalTests++;
  console.log('8️⃣ Testing specific shipping fee (Alger Centre)...');
  try {
    const response = await axios.get(`${BASE_URL}/api/shipping-fees?wilaya=Alger&city=Alger%20Centre`);
    if (response.data.success && response.data.shippingFee) {
      console.log('✅ Specific shipping fee passed');
      console.log(`   Domicile: ${response.data.shippingFee.domicilePrice} DZD`);
      console.log(`   Stopdesk: ${response.data.shippingFee.stopdeskPrice} DZD`);
      passedTests++;
    } else {
      console.log('❌ Specific shipping fee failed');
    }
  } catch (error) {
    console.log('❌ Specific shipping fee failed:', error.response?.data || error.message);
  }
  console.log('');
  
  // Test 9: Admin login
  totalTests++;
  console.log('9️⃣ Testing admin login...');
  try {
    const loginData = {
      username: 'robottopdz',
      password: 'Osamu13579*+-/'
    };
    
    const response = await axios.post(`${BASE_URL}/api/admin/login`, loginData);
    if (response.data.success && response.data.token) {
      console.log('✅ Admin login passed');
      console.log(`   Token received: ${response.data.token.substring(0, 20)}...`);
      passedTests++;
    } else {
      console.log('❌ Admin login failed');
    }
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data || error.message);
  }
  console.log('');
  
  // Test 10: Create product
  totalTests++;
  console.log('🔟 Testing product creation...');
  try {
    const productData = {
      name: 'Robe Test API',
      price: 2500,
      category: 'robes',
      description: 'Robe créée via test automatique',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Noir', 'Blanc', 'Rouge']
    };
    
    const response = await axios.post(`${BASE_URL}/api/products`, productData);
    if (response.data.success && response.data.productId) {
      console.log('✅ Product creation passed');
      console.log(`   Product ID: ${response.data.productId}`);
      passedTests++;
    } else {
      console.log('❌ Product creation failed');
    }
  } catch (error) {
    console.log('❌ Product creation failed:', error.response?.data || error.message);
  }
  console.log('');
  
  // Final results
  console.log('🎯 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
  console.log(`📊 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Your e-commerce is 100% functional! 🚀');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('\n✅ Most tests passed! Your e-commerce is mostly functional.');
    console.log('🔧 Check the failed tests above for remaining issues.');
  } else {
    console.log('\n⚠️ Several tests failed. Please check the issues above.');
    console.log('🔧 Focus on database connection and API endpoints.');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Fix any failing tests');
  console.log('2. Test manually on your website');
  console.log('3. Deploy to production');
  console.log('4. Monitor logs for any issues');
}

// Run all tests
testAllFunctions().catch(console.error);
